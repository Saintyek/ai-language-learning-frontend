export interface SceneOption {
  label: string
  value: string
  children?: SceneOption[]
}

export const sceneOptions: SceneOption[] = [
  {
    label: '角色',
    value: 'role',
    children: [
      { label: '扮演配偶', value: '扮演配偶' },
      { label: '扮演律师', value: '扮演律师' },
      { label: '扮演业务伙伴', value: '扮演业务伙伴' },
      { label: '扮演同事', value: '扮演同事' },
      { label: '扮演同学', value: '扮演同学' },
      { label: '扮演空姐', value: '扮演空姐' },
      { label: '扮演父亲', value: '扮演父亲' },
      { label: '扮演好朋友', value: '扮演好朋友' },
      { label: '扮演辅导员', value: '扮演辅导员' },
      { label: '扮演老师', value: '扮演老师' },
      { label: '扮演医生', value: '扮演医生' },
    ],
  },
  {
    label: '职业培训',
    value: 'professional-training',
    children: [
      { label: '程序员', value: '程序员' },
      { label: '客户服务', value: '客户服务' },
      { label: '银行职员', value: '银行职员' },
      { label: '护理人员', value: '护理人员' },
      { label: '理发师', value: '理发师' },
      { label: '记者', value: '记者' },
    ],
  },
  {
    label: '医疗',
    value: 'medical',
    children: [
      { label: '在病房买药', value: '在病房买药' },
      { label: '扮演兽医', value: '扮演兽医' },
      { label: '扮演牙医', value: '扮演牙医' },
      { label: '扮演心理医生', value: '扮演心理医生' },
      { label: '扮演儿科医生', value: '扮演儿科医生' },
      { label: '扮演眼科医生', value: '扮演眼科医生' },
    ],
  },
  {
    label: '旅行',
    value: 'travel',
    children: [
      { label: '签证面试', value: '签证面试' },
      { label: '入住酒店', value: '入住酒店' },
      { label: '参观博物馆', value: '参观博物馆' },
      { label: '观光', value: '观光' },
      { label: '在当地市场购物', value: '在当地市场购物' },
      { label: '品尝当地美食', value: '品尝当地美食' },
      { label: '预订航班', value: '预订航班' },
      { label: '预订酒店', value: '预订酒店' },
      { label: '坐出租车', value: '坐出租车' },
      { label: '机场安检', value: '机场安检' },
    ],
  },
  {
    label: '工作',
    value: 'work',
    children: [
      { label: '模拟面试', value: '模拟面试' },
      { label: '编写简历', value: '编写简历' },
      { label: '参加会议', value: '参加会议' },
      { label: '进行演讲', value: '进行演讲' },
      { label: '与同事沟通', value: '与同事沟通' },
      { label: '与客户沟通', value: '与客户沟通' },
      { label: '安排会议', value: '安排会议' },
    ],
  },
  {
    label: '日常生活',
    value: 'daily-life',
    children: [
      { label: '烹饪', value: '烹饪' },
      { label: '杂货店购物', value: '杂货店购物' },
      { label: '在餐厅点餐', value: '在餐厅点餐' },
      { label: '和邻居聊天', value: '和邻居聊天' },
      { label: '询问路线', value: '询问路线' },
      { label: '赞美', value: '赞美' },
      { label: '道歉', value: '道歉' },
      { label: '表达感谢', value: '表达感谢' },
      { label: '表达爱意', value: '表达爱意' },
      { label: '谈论爱好', value: '谈论爱好' },
    ],
  },
  {
    label: '娱乐',
    value: 'entertainment',
    children: [
      { label: '看电影', value: '看电影' },
      { label: '听音乐', value: '听音乐' },
      { label: '读书', value: '读书' },
      { label: '玩游戏', value: '玩游戏' },
      { label: '参加体育活动', value: '参加体育活动' },
      { label: '参加聚会', value: '参加聚会' },
      { label: '唱歌', value: '唱歌' },
      { label: '跳舞', value: '跳舞' },
      { label: '绘画', value: '绘画' },
      { label: '摄影', value: '摄影' },
    ],
  },
]
