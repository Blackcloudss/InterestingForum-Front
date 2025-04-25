const app = getApp();
const atoken = app.globalData.atoken;
Page({
  data: {
    // 第一个板块
    userInfo: {
      avatarUrl: '',
      nickName: '',
      sex:'',
      genders: ['请选择性别', '男', '女'], 
    genderIndex: 0,

      birthday:'',
      tag:'',
      signature:'',
      realName: '', 
      studentIdDisplay: '', 
      departments: '',
      major: '', 
      enrollmentYears:'',
      phoneNumber: '' ,
    },
    
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
  },
  
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    const { nickName } = this.data.userInfo
    this.setData({
      "userInfo.avatarUrl": avatarUrl,
      hasUserInfo: nickName && avatarUrl ,
    })
  },
onInputChange(e) {
  const nickName = e.detail.value
  const { avatarUrl } = this.data.userInfo
  this.setData({
    "userInfo.nickName": nickName,
    hasUserInfo: nickName && avatarUrl ,
  })
},
getUserProfile(e) {
  wx.getUserProfile({
    desc: '展示用户信息', 
    success: (res) => {
      console.log(res)
      this.setData({
        userInfo: res.userInfo,
        hasUserInfo: true
      })
    }
  })
},
  onLoad() {
    this.GetCommonProfile()
    this.GetProfileProfile()
    
  },
//获取基础信息
  GetCommonProfile(){
    console.log('获取基础信息的方法执行');
    app.request({
      url: `https://backend.interesting-forum.cn/api/profile/common/show`,
     method: 'GET'
     }).then(res => {
       console.log('获取到的我的基础---:', res.data);
       
       if (res.code === 20000 && res.data) {
         const data = res.data;
         const sex = res.data.sex || '';
        const newGenders = [sex || '请选择性别', '男', '女'];

         this.setData({
            nickName:data.nickname|| '匿名用户',
            sex: sex,
        'userInfo.genders': newGenders,
        // 根据sex设置默认选中项
        'userInfo.genderIndex': sex === '男' ? 1 : sex === '女' ? 2 : 0,
             tag: data.tag,
             birthday:data.birthday,
             
             'userInfo.signature': data.sign||'暂无个性签名',
             'userInfo.avatarUrl': data.avatar ? 'https://backend.interesting-forum.cn' + data.avatar : '/图片素材/post-icon/touxiang/默认头像.webp',
         });
        
       } else {
         throw new Error('返回数据异常');
       }
     }).catch(err => {
       console.error('获取基础信息失败:', err);
       wx.showToast({
         title: '获取基础信息失败',
         icon: 'none'
       });
     });
  },
 
//获取我的隐私信息
GetProfileProfile(){
    console.log('获取隐私信息的方法执行');
    app.request({
      url: `https://backend.interesting-forum.cn/api/profile/private/show`,
     method: 'GET'
     }).then(res => {
       console.log('获取到的我的隐私---:', res.data);
       
       if (res.code === 20000 && res.data) {
         const data = res.data;
         this.setData({
            realName:data.name,  
            studentIdDisplay:data.studentId|| '匿名用户',
            departments: data.academy,
            enrollmentYears:data.grade,
            major:data.major,
            phoneNumber:data.phone,
           });
        
       } else {
         throw new Error('返回数据异常');
       }
     }).catch(err => {
       console.error('获取基础信息失败:', err);
       wx.showToast({
         title: '获取基础信息失败',
         icon: 'none'
       });
     });
  },


// 保存基本信息到后端
SaveCommonProfile() {
  const { userInfo } = this.data;
  const app = getApp();
  
 // 从userInfo中提取必要字段
 const avatarUrl = userInfo.avatarUrl;
 const nickName = userInfo.nickName;
 const gender = userInfo.genderIndex === 1 ? '男' : userInfo.genderIndex === 2 ? '女' : '';
 const signature = userInfo.signature;

 // 字段校验
 if (!avatarUrl) {
   wx.showToast({ title: '请上传头像', icon: 'none' });
   return;
 }
 if (!nickName.trim()) {
   wx.showToast({ title: '请输入昵称', icon: 'none' });
   return;
 }
 if (!signature.trim()) {
   wx.showToast({ title: '请输入个性签名', icon: 'none' });
   return;
 }
 if (userInfo.genderIndex === 0) {
   wx.showToast({ title: '请选择性别', icon: 'none' });
   return;
 }

  // 使用Promise包装的微信文件上传
  const uploadTask = () => new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `https://backend.interesting-forum.cn/api/profile/common/update`, // 确保地址正确
      filePath: userInfo.avatarUrl,
      name: 'avatar', // 参数名需要与后端一致
      formData: {
        nickname: userInfo.nickName,
        sex: userInfo.genderIndex === 1 ? '男' : '女',
        sign: userInfo.signature
      },
      header: {
        'Authorization': app.globalData.atoken // 携带token
      },
      success: (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`请求失败，状态码：${res.statusCode}`))
          return
        }
        try {
          const data = JSON.parse(res.data)
          resolve(data)
        } catch (e) {
          reject(new Error('响应数据解析失败'))
        }
      },
      fail: (err) => reject(err)
    })
  })

  // 执行上传并处理结果
  wx.showLoading({ title: '保存中...' })
  uploadTask()
    .then(response => {
      if (response.code === 20000) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        app.globalData.userInfo = {
          ...app.globalData.userInfo,
          avatar: userInfo.avatarUrl,
          nickname: userInfo.nickName,
          sign: userInfo.signature
        }
        setTimeout(() => {
          wx.switchTab({ url: '/pages/home/home' })
        }, 1500)
      } else {
        throw new Error(response.message || '保存失败')
      }
    })
    .catch(err => {
      console.error('保存失败:', err)
      wx.showToast({
        title: err.message || '保存失败',
        icon: 'none'
      })
    })
    .finally(() => wx.hideLoading())
},
  // 昵称输入事件
  onNicknameInput(e) {
    this.setData({
      nickname: e.detail.value
    });
  },

  // 个性签名输入事件
  onSignatureInput(e) {
    this.setData({
      'userInfo.signature': e.detail.value 
    });
  }
  ,

  // 性别选择事件
  onGenderChange(e) {
    this.setData({
      "userInfo.genderIndex": e.detail.value
    });
  },


  
});