import React, { useState } from 'react'
import { Button, Input, Form, Alert } from 'antd'

const Signup: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form] = Form.useForm()

  const onFinish = async () => {
    setLoading(true)
    setError(null)

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      // 这里可以添加注册成功后的跳转逻辑
    } catch {
      setError('注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">创建新账户</h2>
            <p className="mt-2 text-sm text-gray-600">
              或{' '}
              <a
                href="/login"
                onClick={e => {
                  e.preventDefault()
                  // 立即重置页面滚动位置
                  window.scrollTo({ top: 0, behavior: 'instant' })
                  // 导航到登录页面
                  window.location.href = '/login'
                }}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-300"
              >
                登录现有账户
              </a>
            </p>
          </div>
        </div>

        {error && (
          <Alert title="注册错误" description={error} type="error" showIcon className="mb-4" />
        )}

        <Form form={form} onFinish={onFinish} className="mt-8 space-y-6 animate-fade-in">
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少需要3个字符' },
            ]}
          >
            <Input placeholder="请输入用户名" className="rounded-lg" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input type="email" placeholder="请输入邮箱" className="rounded-lg" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请设置密码' },
              { min: 6, message: '密码至少需要6个字符' },
            ]}
          >
            <Input.Password placeholder="请设置密码" className="rounded-lg" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="请确认密码" className="rounded-lg" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-300"
            >
              注册
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default Signup
