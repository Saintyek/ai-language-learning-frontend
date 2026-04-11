export interface LanguageOption {
  code: string
  label: string
  scene: string
  tag: string
}

export const languageOptions: LanguageOption[] = [
  { code: 'cn', label: '中文', scene: '日常表达与自然互动', tag: '轻松入门' },
  { code: 'jp', label: '日文', scene: '旅行会话与点餐交流', tag: '场景练习' },
  { code: 'kr', label: '韩语', scene: '生活交流与高频短句', tag: '高频场景' },
  { code: 'us', label: '美式英语', scene: '口语训练与即时反馈', tag: '推荐首选' },
]
