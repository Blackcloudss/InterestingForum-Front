const app = getApp();
// headers.Authorization = this.globalData.atoken;
Page({
  data: {
    navScrollLeft: 0,
    navItems: [
      {text: '标题', value: 'title'},
      {text: '标签', value: 'tag'},
      {text: '用户', value: 'nickname'},
      {text: '全部', value: 'all'}
    ],
    // 添加分类映射和空状态提示
    categoryMap: {
      title: '标题',
      tag: '标签',
      nickname: '用户',
      all: '全部'
    },
    emptyMessage: '',
    currentCategory: 0,
    keyword: '',
    title:'',
    currentPosts: [],
    loading: true, // 新增加载状态控制
    refresherTriggered: false, // 添加下拉刷新状态控制
  },
  
  onNavItemTap(e) {
    const index = e.currentTarget.dataset.index;
    const categoryValue = this.data.navItems[index].value;
    this.setData({
      currentCategory: index,
      loading: true 
    }, () => {
      this.showPostsByCategory(categoryValue);
    });
    this.showPostsByCategory(categoryValue);
    console.log('categoryValue',categoryValue)
  },

 

  showPostsByCategory(categoryValue) {
    const requestData = {
      page: 1,
      page_size: 10,
      keyword: this.data.keyword,
      search_type: categoryValue // 确保使用正确的分类参数
    };

    const that = this; 
    console.log('当前使用的搜索类型:', categoryValue);
    wx.showLoading({ title: '加载中...' });

    // 简化请求逻辑
    return new Promise((resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        reject(new Error('请求超时，请检查网络'));
      }, 15000);

      const requestData = {
        page: 1,
        page_size: 10,
        keyword:this.data.keyword,
        search_type: categoryValue
      };

      console.log('发送请求参数:', requestData);

      // 定义请求参数

// 将参数对象转换为查询字符串
const queryString = Object.keys(requestData)
 .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(requestData[key]))
 .join('&');
      app.request({
        url: 'http://117.50.46.248:8085/api/search/blogs'+'?'+queryString ,
        method: 'GET',
        
      }).then(res => {
        clearTimeout(timeoutTimer);
        console.log('收到响应数据:', res);

        // 检查响应状态
        if (!res || res.code !== 20000) {
          throw new Error('接口返回状态异常');
        }

        // 处理正常数据
        const posts = res.data.blogs.map(blog => ({
          id: blog.blog_id || Date.now(),
          avatar: `https://backend.interesting-forum.cn`+blog.avatar || '/图片素材/post-icon/touxiang/默认头像.webp',
          avatarl: that._mapSubTag(blog.sub_tag || sub_tag),
          username: blog.nickname || '匿名用户',
          time: that._formatTime(blog.created_at || blog.create_at),
          content: blog.content || '暂无内容',
          title: blog.title || '暂无标题',
          likes: blog.like_count || blog.be_liked || 0,
          comments: blog.comment_count || 0,
          collects: blog.collect_count || 0
        }));

        that.setData({
          currentPosts: posts,
          loading: false
        });
        
        resolve();

      }).catch(err => {
        clearTimeout(timeoutTimer);
        console.error('请求出错:', err);

        that._handleError(err.message);
        reject(err);
      }).finally(() => {
        wx.hideLoading();
      });
    });
  },

  // 修改错误处理
  _handleError(message) {
    console.error('请求异常:', message);
    
    let errorText = '无相关内容';
    const errorMap = {
      'token': '登录状态异常，请退出重新进入',
      '超时': '网络不稳定，请检查连接',
      '空响应': '服务器暂时不可用',
      '接口返回状态异常': '服务器繁忙，请稍后再试'
    };

    // 特殊处理空数据情况
    if (message.includes('blogs')) {
      errorText = '暂时没有相关内容';
      this.setData({ currentPosts: [] });
      return;
    }

    Object.keys(errorMap).forEach(key => {
      if (message.includes(key)) errorText = errorMap[key];
    });

    this.setData({ 
      currentPosts: [],
      loading: false 
    });

    wx.showToast({
      title: errorText,
      icon: 'none',
      duration: 3000
    });
  },

  // 加强分类图标映射
  _mapSubTag: function(subTag) {
    const subTagMap = {
      '二手交易': '/图片素材/post-icon/postsort/campuslife-postsort/二手交易1.png', // 修正路径
      '失物招领': '/图片素材/post-icon/postsort/campuslife-postsort/失物招领.png',
      '吃喝玩乐': '/图片素材/post-icon/postsort/campuslife-postsort/吃喝玩乐.png',
      '跑腿代拿': '/图片素材/post-icon/postsort/campuslife-postsort/跑腿代拿.png',
      '兼职招聘': '/图片素材/post-icon/postsort/campuslife-postsort/兼职招聘.png',
      '爱心': '/图片素材/post-icon/postsort/有爱校园.png' // 确保路径正确
    };
    return subTagMap[subTag] || subTagMap['二手交易'];
  },

  // 时间格式化方法（需添加到 Page 对象中）
  _formatTime: function(timeString) {
    if (!timeString) return '刚刚';
    const date = new Date(timeString);
    const now = new Date();
    const diff = now - date;
    const minute = Math.floor(diff / 60000);
    if (minute < 1) return '刚刚';
    if (minute < 60) return `${minute}分钟前`;
    const hour = Math.floor(diff / 3600000);
    if (hour < 24) return `${hour}小时前`;
    const day = Math.floor(diff / 86400000);
    return `${day}天前`;
  },
  onLoad(options) {
    const keyword = decodeURIComponent(options.keyword || '');
    const initialCategory = options.category ? parseInt(options.category) : 0;
    this.setData({ 
      keyword: keyword ,
      currentCategory: initialCategory
    }, () => {
      // 使用分类对应的value值进行首次加载
      const categoryValue = this.data.navItems[initialCategory].value;
      this.showPostsByCategory(categoryValue);
    });
  },
  
  onCommentTap(e) {
    const index = e.currentTarget.dataset.index;
    wx.showToast({
      title: `评论 ${this.data.posts[index].user}`,
      icon: 'none'
    });
  },
  // 定义 handleLike 方法
  handleLike(e) {
    const postId = e.currentTarget.dataset.id;
    const currentPosts = this.data.currentPosts;
    const updatedPosts = currentPosts.map(post => {
      if (post.id === postId) {
        return { ...post, likes: post.likes + 1 };
      }
      return post;
    });
    this.setData({ currentPosts: updatedPosts });
    const post = updatedPosts.find(p => p.id === postId);
    this.updateLike(postId, post.likes);
  },
  updateLike(postId, likes) {
    // 示例中的网络请求
    wx.request({
      url: 'https://your-backend-api/update_likes', // 替换为你的后端 API 地址
      method: 'POST',
      data: {
        postId,
        likes
      },
      success: (res) => {
        console.log('点赞成功，后台已更新：', res.data);
        // 可以在这里提示用户
        wx.showToast({
          title: '点赞成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('点赞失败：', err);
        wx.showToast({
          title: '点赞失败',
          icon: 'none'
        });
      }
    });
  }
});
