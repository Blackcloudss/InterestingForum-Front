Component({
  properties: {
    postId: {
      type: Number,  // 改为 Number 类型，因为后端期望接收数字类型的 blog_id
      value: 70975004096
    },
    avatar: {
      type: String,
      value: '/图片素材/post-icon/touxiang/默认头像.webp' // 组件层默认值
    },
    avatarl: {
      type: String,
      value: '/图片素材/post-icon/postsort/校园杂谈（图标）.png' // 组件层默认值
    },
    title: String,
    username: String,
    time: String,
    content: String,
    likes: Number,
    comments: Number,
    collects: Number,
    isLiked: Boolean,     
    isCollected: Boolean,
  },
  methods: {
   
    handleLike(e) {
      console.log('--- handleLike 方法被触发 ---'); // 先确认此日志是否打印
      const postId = this.properties.postId;
      console.log('当前帖子ID:', postId);
      const requestData = { blog_id: postId};
      console.log('请求参数:', requestData);
      const app = getApp();

      app.request({
        url: "https://backend.interesting-forum.cn/api/blog/like", // 固定 URL
        method: "POST",
        
        data: requestData
      }).then(res => {
        if (res.code === 20000) {
          // 直接使用后端返回的状态更新
          const { is_liked, like_count } = res.data;
          console.log('触发like事件，参数:', { postId, isLiked: is_liked, likes: like_count });
          this.triggerEvent("like", {
            postId: postId,
            isLiked: is_liked,  // 使用后端返回的状态
            likes: like_count    // 使用后端返回的点赞数
          })
        }
      }).catch(err => {
        console.error("点赞失败:", err);
      });
    },
    handleCollect(e) {
      console.log('--- handleCollect 方法被触发 ---');
      const postId = this.properties.postId;
      console.log('当前帖子ID:', postId);
      const requestData = { blog_id: postId};
      console.log('请求参数:', requestData);
      const app = getApp();

      app.request({
        url: "https://backend.interesting-forum.cn/api/blog/collect", // 固定 URL
        method: "POST",
        header: { 
          'Authorization': getApp().globalData.atoken 
        },
        data: requestData
      }).then(res => {
        if (res.code === 20000) {
          // 直接使用后端返回的状态更新
          const { is_collected, collect_count } = res.data;
          this.triggerEvent("collect", {
            postId: postId,
            isCollected: is_collected, // 后端返回最新状态
            collects: collect_count     // 后端返回最新数量
          });
        }
      }).catch(err => {
        console.error("收藏失败:", err);
      });
    }
  }

});