import React from 'react'

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-28">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">AI语言学习</h3>
            <p className="text-gray-400">通过先进的AI技术，让语言学习变得更加自然、高效。</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">快速链接</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  首页
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  功能
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  课程
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  关于我们
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">联系我们</h3>
            <ul className="space-y-2">
              <li className="text-gray-400">邮箱: contact@ailanguage.com</li>
              <li className="text-gray-400">电话: 400-123-4567</li>
              <li className="text-gray-400">地址: 北京市海淀区科技园区</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">关注我们</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white text-xl">
                微信
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-xl">
                微博
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-xl">
                抖音
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-xl">
                B站
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>© 2026 AI语言学习平台. 保留所有权利.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
