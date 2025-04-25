const app = getApp();
Page({
  data: {
    followCount: 0,
    followerCount: 1,
    signature:'',
    posts: [],
    favorites: [],
    currentTab: 'posts',
    name:'',
    awaver:'',
    tag:'',
    birthday:'',
    user_id:0,
    page: 1,
    pageSize: 10,
    avatarUrl: '/图片素材/1-5我的主页/个人主页.png' // 默认头像路径
  },
  onLoad(options) {
     const user_id = options.user_id;
     console.log('他人主页收到的user_id:', user_id);
     this.setData({user_id:options.user_id});
     if (!user_id) {
       console.error('未收到user_id参数');
       wx.showToast({ title: '参数错误', icon: 'none' });
       return;
  
  }
  const app = getApp();
  app.request({
   url: `https://backend.interesting-forum.cn/api/profile/common/other?otherid=${user_id}`,
    method: 'GET'
  }).then(res => {
    console.log('获取到的他人主页详情:', res.data);
    
    if (res.code === 20000 && res.data) {
      const data = res.data;
      const baseURL = "https://backend.interesting-forum.cn";
      const images = Array.isArray(data.images) ? data.images.map(item => baseURL + item) : [];
      console.log('拼接图片路径:',images);
      this.setData({
          name:data.nickname|| '匿名用户',
          sex: data.sex,
          tag: data.tag,
          birthday:data.birthday,
          signature: data.sign,
          avatar: 'https://backend.interesting-forum.cn'+data.avatar || '/图片素材/post-icon/touxiang/默认头像.webp',
      });
      this.loadPosts(); 
    } else {
      throw new Error('返回数据异常');
    }
  }).catch(err => {
    console.error('获取帖子详情失败:', err);
    wx.showToast({
      title: '获取详情失败',
      icon: 'none'
    });
  });
},
  // 加载“我的帖子”
  loadPosts() {
    const requestData = {
      user_id:this.data.user_id,
      page: 1,
      page_size: 10
    };

    console.log('发送请求参数:', requestData)
    
    app.request({
      url: `https://backend.interesting-forum.cn/api/blog/other?user_id=${this.data.user_id}&page=1&page_size=10`,
      method: 'GET',
      data: requestData
      }).then(res => {
       
        console.log('收到响应数据:', res);
        
         // 检查响应状态
        if (!res || res.code !== 20000) {
          throw new Error('接口返回状态异常');
        }

        const posts = res.data.blogs.map(blog => ({
          id: blog.blog_id || Date.now(),
          avatar: `https://backend.interesting-forum.cn`+blog.avatar || '/图片素材/post-icon/touxiang/默认头像.webp',
          username: blog.nickname || '匿名用户',
          content: blog.content || '暂无内容',
          title: blog.title || '暂无标题',
          likes: blog.like_count || blog.be_liked || 0,
          comments: blog.comment_count || 0,
          collects: blog.collect_count || 0
        }));

        this.setData({ posts });
        resolve();
      }).finally(() => {
        wx.hideLoading();
      });
      
  },

  // 加载“我的收藏”
  loadFavorites() {
    const requestData = {
      page: this.data.page,
      page_size: this.data.pageSize
    };
    app.request({
      url: `http://117.50.46.248:8085/api/blog/myself/collected?page=${this.data.page}&page_size=${this.data.pageSize}` ,
      method: 'GET',
      data: requestData
      }).then(res => {
       
        console.log('收到响应数据:', res);
        
         // 检查响应状态
        if (!res || res.code !== 20000) {
          throw new Error('接口返回状态异常');
        }

        const posts = res.data.blogs.map(blog => ({
          id: blog.blog_id || Date.now(),
          avatar:`https://backend.interesting-forum.cn`+ blog.avatar || '/图片素材/post-icon/touxiang/默认头像.webp',
          username: blog.nickname || '匿名用户',
          content: blog.content || '暂无内容',
          title: blog.title || '暂无标题',
          likes: blog.like_count || blog.be_liked || 0,
          comments: blog.comment_count || 0,
          collects: blog.collect_count || 0
        }));

        this.setData({ favorites: posts });
        
      }).finally(() => {
        wx.hideLoading();
        console.log('更新后的favorites数据:', this.data.favorites);
      });
      
  },

  // 切换 Tab 时触发对应请求
  showPosts() {
    this.setData({ currentTab: 'posts' });
    if (this.data.posts.length === 0) this.loadPosts(); // 避免重复加载
  },

  showFavorites() {
    this.setData({ currentTab: 'favorites' });
    if (this.data.favorites.length === 0) this.loadFavorites();
  },

  // 分页加载更多（示例）
  onReachBottom() {
    this.setData({ page: this.data.page + 1 }, () => {
      if (this.data.currentTab === 'posts') this.loadPosts(true);
      else this.loadFavorites(true);
    });
  }
});