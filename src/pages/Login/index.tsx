import React, { useState } from 'react'
import { Button, Checkbox, Input, Form, Alert } from 'antd'

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form] = Form.useForm()

  const onFinish = async (_values: any) => {
    setLoading(true)
    setError(null)

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      // 这里可以添加登录成功后的跳转逻辑
    } catch {
      setError('登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">登录到 AI语言学习</h2>
            <p className="mt-2 text-sm text-gray-600">
              或{' '}
              <a
                href="/signup"
                onClick={e => {
                  e.preventDefault()
                  // 立即重置页面滚动位置
                  window.scrollTo({ top: 0, behavior: 'instant' })
                  // 导航到注册页面
                  window.location.href = '/signup'
                }}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-300"
              >
                创建新账户
              </a>
            </p>
          </div>
        </div>

        {error && (
          <Alert title="登录错误" description={error} type="error" showIcon className="mb-4" />
        )}

        <Form form={form} onFinish={onFinish} className="mt-8 space-y-6 animate-fade-in">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名或邮箱' }]}>
            <Input placeholder="请输入邮箱" className="rounded-lg" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="请输入密码" className="rounded-lg" />
          </Form.Item>

          <div className="flex items-center justify-between">
            <Form.Item name="remember" valuePropName="checked">
              <Checkbox className="text-gray-700">记住我</Checkbox>
            </Form.Item>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-300"
              >
                忘记密码？
              </a>
            </div>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-300"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default Login
