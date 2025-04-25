// chat.js
const app = getApp();
Page({
  data: {
    messages: [],
    inputValue: '',
    lastMessageId: 0,
    myAvatar: '/图片素材/post-icon/touxiang/头像3.png',
    friendAvatar: '/图片素材/post-icon/touxiang/头像4.png',
    selectedImage: null,
    socket: null,
    toUserId: 814761004097,
    isConnected: false  // 新增连接状态标识
  },

  onLoad() {
    this.connectWebSocket();
  },

  connectWebSocket() {
    const socketTask = wx.connectSocket({
      url: 'wss://backend.interesting-forum.cn/api/chat/wschat',
      header: {
        'atoken': app.globalData.atoken
      }
    });

    // 正确绑定WebSocket事件
    socketTask.onOpen((res) => {
      console.log('WebSocket连接成功');
      this.setData({ 
        socket: socketTask,
        isConnected: true 
      });
    });

    socketTask.onMessage((res) => {
      try {
        const msg = JSON.parse(res.data);
        this.handleReceivedMessage(msg);
      } catch (e) {
        console.error('消息解析失败:', e);
      }
    });

    socketTask.onError((err) => {
      console.error('WebSocket错误:', err);
      this.setData({ isConnected: false });
      this.reconnectWebSocket();
    });

    socketTask.onClose(() => {
      console.log('WebSocket已关闭');
      this.setData({ isConnected: false });
    });

    this.setData({ socket: socketTask });
  },

  // 增加重连机制
  reconnectWebSocket() {
    setTimeout(() => {
      if (!this.data.isConnected) {
        console.log('尝试重新连接WebSocket...');
        this.connectWebSocket();
      }
    }, 3000);
  },

  handleReceivedMessage(msg) {
    if (msg.type === 'MESSAGE') {
      const newMessage = {
        id: this.data.lastMessageId + 1,
        content: msg.content,
        isMe: msg.from !== this.data.toUserId, // 根据实际接口调整
        timestamp: this.getCurrentTime()
      };
      this.setData({
        messages: [...this.data.messages, newMessage],
        lastMessageId: this.data.lastMessageId + 1
      });
    }
  },

  sendMessage() {
    const { inputValue, selectedImage, socket, isConnected } = this.data;
    
    if (!inputValue.trim() && !selectedImage) {
      wx.showToast({ title: '消息不能为空', icon: 'none' });
      return;
    }

    if (!isConnected) {
      wx.showToast({ title: '连接未就绪', icon: 'none' });
      return;
    }

    const msgData = {
      type: "MESSAGE",
      msgID: Date.now().toString(),
      to: this.data.toUserId,
      content: inputValue
    };

    // 发送消息时增加状态检查
    socket.send({
      data: JSON.stringify(msgData),
      success: () => {
        const newMessage = {
          id: this.data.lastMessageId + 1,
          content: inputValue,
          image: selectedImage,
          isMe: true,
          timestamp: this.getCurrentTime()
        };
        this.setData({
          messages: [...this.data.messages, newMessage],
          inputValue: '',
          selectedImage: null,
          lastMessageId: this.data.lastMessageId + 1
        });
      },
      fail: (err) => {
        console.error('发送失败:', err);
        wx.showToast({ title: '发送失败，正在重试...', icon: 'none' });
        this.reconnectWebSocket();
      }
    });
  },

  // 原有方法保持不变
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          selectedImage: res.tempFilePaths[0]
        });
        wx.showToast({ title: '图片已选择', icon: 'success' });
      }
    });
  },

  getCurrentTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  },

  onUnload() {
    if (this.data.socket && this.data.isConnected) {
      this.data.socket.close();
    }
  }
});