import { languageOptions } from '@/consts/languages'

export interface MenuItem {
  key: string
  label: string
  href: string
}

export type LanguageOption = (typeof languageOptions)[0]
