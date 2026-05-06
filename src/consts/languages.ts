export interface LanguageOption {
  code: string
  label: string
  scene: string
  tag: string
}

export const languageOptions: LanguageOption[] = [
  { code: 'cn', label: '中文', scene: '自然流畅的中文对话，提升日常表达能力', tag: '中文练习' },
  { code: 'jp', label: '日文', scene: '沉浸式日语学习，掌握地道口语表达', tag: '日语会话' },
  { code: 'es', label: '西班牙语', scene: '热情洋溢的西班牙语交流，探索西语文化', tag: '西语入门' },
  { code: 'us', label: '美式英语', scene: '标准美式发音，全方位提升英语听说能力', tag: '英语进阶' },
]
