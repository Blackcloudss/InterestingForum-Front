const app = getApp();
Page({
  data: {
    departments: ['请选择学院','马克思主义学院','计算机科学与技术学院', '卓越工程师学院','电信工程与智能化学院','生态环境与建筑工程学院','化学工程与能源技术学院','机械工程学院','材料科学与工程学院','国际微电子学院','生命健康技术学院','经济与管理学院','文学与传媒学院','法律与社会工作学院','教育学院','粤台产业科技学院','东莞理工学院法国国立工艺学院联合学院','学生社区知行学院','国际学院'],
    years: ['请选择年级','2025', '2024', '2023', '2022', '2021','2020','2019','2018','2017','2016','2015','2014','2013','2012','2011','2010','2009','2008','2007','2006','2005','2004','2003','2002','2001','2000'],
    selectedDepartment: '',
    selectedYear: '',
    departmentIndex: 0,  // 新增索引变量
    yearIndex: 0,        // 新增索引变量
    realName: '',
    studentId: '',
    department: '',
    major: '',
    enrollmentYear: '',
    phone: '',
    imagePath: '',
    isAgreed: false
  }, 
  onRealNameIdInput(e) {
    this.setData({ realName: e.detail.value });
  },
  onStudentIdInput(e) {
    this.setData({ studentId: e.detail.value });
  },
  onMajorIdInput(e) {
    this.setData({ major: e.detail.value });
  },

  // 院系选择事件
  departmentChange(e) {
    const index = e.detail.value;
    this.setData({
      departmentIndex: index,
      selectedDepartment: this.data.departments[index]
    });
  },
// 入学年份选择事件
yearChange(e) {
  const index = e.detail.value;
  this.setData({
    yearIndex: index,
    selectedYear: this.data.years[index]
  });
},
  // 手机号输入处理
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },
// 协议勾选状态改变时的处理函数
onAgreementChange(e) {
  this.setData({
    isAgreed: !this.data.isAgreed
  });
},
onRealNameInput(e) {
  this.setData({ realName: e.detail.value });
},
  // 表单提交
formSubmit(e) {
  const formData = e.detail.value;
  
  // 合并选择器数据
  const fullData = {
    ...formData,
    department: this.data.selectedDepartment,
    enrollmentYear: this.data.selectedYear
  };

  // 执行验证
  if (!this.validateForm(fullData)) return;

  // 直接使用表单数据构建请求对象
  const requestData = {
    name: fullData.realName,               
    studentId: fullData.studentId,         
    academy: fullData.department,           
    grade: fullData.enrollmentYear,        
    major: fullData.major,                 
    phone: fullData.phone                  
  };

  // 显示加载状态
  wx.showLoading({ title: '提交中...' });

  app.request({
    url: `https://backend.interesting-forum.cn/api/profile/private/update`,
    method: 'PUT',
    data: requestData  // 使用修正后的数据
  }).then(res => {
    wx.hideLoading();
    if (res.code === 20000) {
      console.log('----提交隐私信息收到返回的数据----：',res);
      wx.showToast({ title: '提交成功' });
       // 执行跳转
       wx.navigateTo({
        url: `/packagesB/home/pages/edit/edit`,
      });
    } else {
      wx.showToast({ title: '提交失败: ' + (res.msg || '未知错误') });
    }
  }).catch(err => {
    wx.hideLoading();
    console.error('提交失败:', err);
    wx.showToast({ title: '网络请求失败', icon: 'none' });
  });
},

  // 表单验证方法
  validateForm(formData) {
    const requiredFields = [
      { key: 'realName', name: '姓名' },
      { key: 'studentId', name: '学号' },
      { key: 'major', name: '专业' },
      { key: 'phone', name: '手机号' }
    ];

    // 字段非空验证
    for (const field of requiredFields) {
      if (!formData[field.key]?.trim()) {
        wx.showToast({ title: `请填写${field.name}`, icon: 'none' });
        return false;
      }
    }

    // 选择器验证
    if (!this.data.selectedDepartment) {
      wx.showToast({ title: '请选择院系', icon: 'none' });
      return false;
    }

    if (!this.data.selectedYear) {
      wx.showToast({ title: '请选择入学年份', icon: 'none' });
      return false;
    }

    // 协议验证
    if (!this.data.isAgreed) {
      wx.showToast({ title: '请先阅读并同意协议', icon: 'none' });
      return false;
    }

    // 手机号格式验证
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return false;
    }

    return true;
  },
    onLoad(options) {
      console.log('接收到的参数:', options); // 用于调试
      const {
        realName = '',
        studentId = '',
        department = '',
        major = '',
        enrollmentYear = '',
        phone = '',
        isAgreed=''
    } = options;
  
    this.setData({
        realName,
        studentId,
        department,
        major,
        enrollmentYear,
        phone,
        isAgreed
    });
    }
})