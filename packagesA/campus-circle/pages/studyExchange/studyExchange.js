const app = getApp();
// headers.Authorization = this.globalData.atoken;
Page({
  data: {
    navScrollLeft: 0,
    navItems: ['资料分享', '课程评价', '赛事大全', '答疑解惑'],
    currentCategory: 0,
    title:'',
    currentPosts: [],
    loading: true, // 新增加载状态控制
    refresherTriggered: false, // 添加下拉刷新状态控制
    // 添加默认帖子数据
    defaultPosts: [
      {
        id: 'default_1',
        avatar: '/图片素材/post-icon/touxiang/默认头像.webp',
        avatarl: '/图片素材/post-icon/postsort/studycommunite-postsort/资料分享.png',
        username: '莞工趣谈官方',
        time: '刚刚',
        content: '欢迎来到莞工趣谈！这里是资料分享专区',
        likes: 0,
        comments: 0,
        collects: 0
      },
      {
        id: 'default_2',
        avatar: '/图片素材/post-icon/touxiang/默认头像.webp',
        avatarl: '/图片素材/post-icon/postsort/studycommunite-postsort/课程评价.png',
        username: '系统管理员',
        time: '刚刚',
        content: '课程评价',
        likes: 0,
        comments: 0,
        collects: 0
      }
    ]
  },
  
  onNavItemTap(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      currentCategory: index,
      loading: true // 切换分类时显示加载状态
    });
    this.showPostsByCategory(index);
  },

  // 添加下拉刷新处理方法
  onScrollRefresh() {
    console.log('触发scroll-view下拉刷新');
    
    // 设置刷新状态
    this.setData({
      refresherTriggered: true
    });

    // 重新加载当前分类的数据
    this.showPostsByCategory(this.data.currentCategory)
      .finally(() => {
        // 结束刷新状态
        this.setData({
          refresherTriggered: false
        });
      });
  },

  showPostsByCategory(categoryIndex) {
    const that = this;  // 保存 this 引用
    const categoryKey = this.data.navItems[categoryIndex];
    const sub_tag = categoryKey;

    // 验证分类标签
    const validSubTags = [
      '资料分享', '课程评价', '赛事大全', '答疑解惑'
    ];

    if (!validSubTags.includes(sub_tag)) {
      console.error('无效的分类标签:', sub_tag);
      return Promise.reject(new Error('无效的分类标签'));
    }

    wx.showLoading({ title: '加载中...' });

    // 简化请求逻辑
    return new Promise((resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        reject(new Error('请求超时，请检查网络'));
      }, 15000);

      const requestData = {
        sub_tag: sub_tag,
        page: 1,
        page_size: 10
      };

      console.log('发送请求参数:', requestData);

      // 定义请求参数


// 将参数对象转换为查询字符串
const queryString = Object.keys(requestData)
 .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(requestData[key]))
 .join('&');
      app.request({
        url: 'http://117.50.46.248:8085/api/blog/show/list/tag'+'?'+queryString ,
        method: 'GET',
        data: requestData
      }).then(res => {
        clearTimeout(timeoutTimer);
        console.log('收到响应数据:', res);

        // 检查响应状态
        if (!res || res.code !== 20000) {
          throw new Error('接口返回状态异常');
        }

        // 处理空数据情况
        if (!res.data?.blogs || !Array.isArray(res.data.blogs) || res.data.blogs.length === 0) {
          console.log('无帖子数据，使用默认帖子');
          const defaultPostsForCategory = that.data.defaultPosts.map(post => ({
            ...post,
            avatarl: that._mapSubTag(sub_tag),
            content: post.content.replace('资料分享', sub_tag),
          }));

          that.setData({
            currentPosts: defaultPostsForCategory,
            loading: false
          });

          wx.showToast({
            title: `暂无${sub_tag}相关帖子`,
            icon: 'none',
            duration: 2000
          });

          resolve();
          return;
        }

        // 处理正常数据
        const posts = res.data.blogs.map(blog => ({
          id: blog.blog_id || Date.now(),
          avatar: 'http://117.50.46.248:8085'+blog.avatar || '/图片素材/post-icon/touxiang/默认头像.webp',
          avatarl: that._mapSubTag(blog.sub_tag || sub_tag),
          username: blog.nickname || '匿名用户',
          time: that._formatTime(blog.created_at || blog.create_at),
          content: blog.content || '暂无内容',
          title: blog.title || '暂无标题',
          likes: blog.like_count || blog.be_liked || 0,
          comments: blog.comment_count || 0,
          collects: blog.collect_count || 0
        }));

        that.setData({
          currentPosts: posts,
          loading: false
        });

        resolve();
      }).catch(err => {
        clearTimeout(timeoutTimer);
        console.error('请求出错:', err);

        // 出错时显示默认帖子
        const defaultPostsForCategory = that.data.defaultPosts.map(post => ({
          ...post,
          avatarl: that._mapSubTag(sub_tag),
          content: post.content.replace('资料分享', sub_tag),
        }));

        that.setData({
          currentPosts: defaultPostsForCategory,
          loading: false
        });

        that._handleError(err.message);
        reject(err);
      }).finally(() => {
        wx.hideLoading();
      });
    });
  },

  // 修改错误处理
  _handleError(message) {
    console.error('请求异常:', message);
    
    let errorText = '加载失败，请稍后重试';
    const errorMap = {
      'token': '登录状态异常，请退出重新进入',
      '超时': '网络不稳定，请检查连接',
      '空响应': '服务器暂时不可用',
      '接口返回状态异常': '服务器繁忙，请稍后再试'
    };

    // 特殊处理空数据情况
    if (message.includes('blogs')) {
      errorText = '暂时没有相关内容';
      this.setData({ currentPosts: [] });
      return;
    }

    Object.keys(errorMap).forEach(key => {
      if (message.includes(key)) errorText = errorMap[key];
    });

    this.setData({ 
      currentPosts: [],
      loading: false 
    });

    wx.showToast({
      title: errorText,
      icon: 'none',
      duration: 3000
    });
  },

  // 加强分类图标映射
  _mapSubTag: function(subTag) {
    const subTagMap = {
      '资料分享': '/图片素材/post-icon/postsort/studycommunite-postsort/资料分享.png', // 修正路径
      '课程评价': '/图片素材/post-icon/postsort/studycommunite-postsort/课程评价.png',
      '答疑解惑': '/图片素材/post-icon/postsort/studycommunite-postsort/答疑解惑.png',
      '赛事大全': '/图片素材/post-icon/postsort/studycommunite-postsort/赛事大全.png' // 确保路径正确
    };
    return subTagMap[subTag] || subTagMap['资料分享'];
  },

  // 时间格式化方法（需添加到 Page 对象中）
  _formatTime: function(timeString) {
    if (!timeString) return '刚刚';
    const date = new Date(timeString);
    const now = new Date();
    const diff = now - date;
    const minute = Math.floor(diff / 60000);
    if (minute < 1) return '刚刚';
    if (minute < 60) return `${minute}分钟前`;
    const hour = Math.floor(diff / 3600000);
    if (hour < 24) return `${hour}小时前`;
    const day = Math.floor(diff / 86400000);
    return `${day}天前`;
  },
  onLoad() {
    // 添加默认分类数据请求
    this.showPostsByCategory(0); // 强制初始加载"资料分享"
    // 移除本地静态数据
    this.setData({ posts: {} });
  },
  
  onCommentTap(e) {
    const index = e.currentTarget.dataset.index;
    wx.showToast({
      title: `评论 ${this.data.posts[index].user}`,
      icon: 'none'
    });
  },
 //监听点赞
 onLike(e) {
  console.log('父组件收到点赞事件:', e.detail);
  const { postId, isLiked, likes } = e.detail; // 参数名需与子组件传递的一致
  
  const currentPosts = this.data.currentPosts.map(post => {
    if (post.id === postId) {
      return { ...post, isLiked, likes };
    }
    return post;
  });
  this.setData({ currentPosts: posts });
},
onCollect(e) {
  console.log('父组件收到收藏事件:', e.detail);
  const { postId, isCollected, collects } = e.detail; // 参数名需与子组件传递的一致
  const posts = this.data.posts.map(post => {
    if (post.id === postId) {
      return { ...post, isCollected, collects };
    }
    return post;
  });
  this.setData({ posts });
},
onPostClick(e) {
  const postId = e.currentTarget.dataset.postid; // 注意这里是小写
  console.log('点击的postId:', postId, '类型:', typeof postId);

  if (!postId || typeof postId !== 'number') {
    console.error('帖子ID无效:', postId);
    wx.showToast({ title: '帖子ID无效', icon: 'none' });
    return;
  }

  wx.navigateTo({
    url: `/pages/post-detail/post-detail?postId=${postId}`
  });
}
});