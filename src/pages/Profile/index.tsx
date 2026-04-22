import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ProfileForm from './components/ProfileForm'
import { languageOptions } from '@/consts/languages'
import 'flag-icons/css/flag-icons.min.css'

const Profile: React.FC = () => {
  const { langCode } = useParams<{ langCode: string }>()
  const navigate = useNavigate()

  // 进入页面时始终保持在顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const currentLanguage = languageOptions.find(lang => lang.code === langCode)

  if (!currentLanguage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">语言不存在</h1>
          <p className="text-gray-600 mb-6">请选择一个有效的语言</p>
          <a href="/" className="text-blue-600 hover:underline">
            返回首页
          </a>
        </div>
      </div>
    )
  }

  const handleSuccess = () => {
    navigate(`/${langCode}/chat`)
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span
              className={`fi fi-${currentLanguage.code} rounded-sm text-4xl`}
              aria-hidden="true"
            />
            <h1 className="text-3xl font-bold text-gray-800">{currentLanguage.label}学习档案</h1>
          </div>
          <p className="text-gray-600">告诉我们你的学习目标，我们会为你定制专属的学习体验</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <ProfileForm
            language={currentLanguage.code}
            languageLabel={currentLanguage.label}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  )
}

export default Profile
