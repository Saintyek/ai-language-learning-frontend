import { Button, Toast } from '@douyinfe/semi-ui'
import { useNavigate } from 'react-router-dom'
import { isAuthenticated } from '@/api/auth'

const Banner = () => {
  const navigate = useNavigate()

  const handleStartTrial = () => {
    if (!isAuthenticated()) {
      Toast.warning({
        content: '请先登录或注册',
        duration: 2,
      })
      navigate('/login')
      return
    }
    navigate('/languages')
  }

  return (
    <section className="pt-64 pb-48 bg-blue-50 ">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight mb-6">
              通过AI对话
              <span className="text-blue-600 block">轻松学习语言</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg">
              利用先进的AI技术，通过真实的对话场景，让语言学习变得更加自然、高效。随时随地练习，快速提升口语能力。
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button
                theme="solid"
                type="primary"
                size="large"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full"
                onClick={handleStartTrial}
              >
                开始免费试用
              </Button>
              <Button
                theme="outline"
                size="large"
                className="border border-gray-300 hover:bg-gray-50 px-8 py-3 rounded-full"
              >
                了解更多
              </Button>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-full h-full bg-blue-200 rounded-2xl opacity-50"></div>
              <div className="relative bg-white rounded-2xl shadow-xl p-6">
                <div className="aspect-video bg-linear-to-r from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🎯</div>
                    <p className="text-gray-700">AI语言学习体验</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Banner
