import React, { useState } from 'react'
import { Banner, Button, Form } from '@douyinfe/semi-ui'
import { useNavigate } from 'react-router-dom'
import { login, saveAuthData } from '@/api/auth'
import type { LoginParams } from '@/api/auth'

interface LoginFormValues extends LoginParams {
  remember?: boolean
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true)
    setError(null)

    try {
      const response = await login({
        email: values.email,
        password: values.password,
      })
      saveAuthData(response.token, response.userInfo)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请检查邮箱和密码')
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
                href="/register"
                onClick={e => {
                  e.preventDefault()
                  window.scrollTo({ top: 0, behavior: 'instant' })
                  window.location.href = '/register'
                }}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-300"
              >
                创建新账户
              </a>
            </p>
          </div>
        </div>

        {error && (
          <Banner
            fullMode={false}
            bordered
            type="danger"
            title="登录错误"
            description={error}
            closeIcon={null}
            className="mb-4"
          />
        )}

        <Form
          initValues={{ remember: false }}
          onSubmit={(values: any) => onSubmit(values as LoginFormValues)}
          className="mt-8 space-y-6 animate-fade-in"
        >
          <Form.Input
            field="email"
            noLabel
            type="email"
            placeholder="请输入邮箱"
            className="rounded-lg"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          />

          <Form.Input
            field="password"
            noLabel
            mode="password"
            placeholder="请输入密码"
            className="rounded-lg"
            rules={[{ required: true, message: '请输入密码' }]}
          />

          <div className="flex items-center justify-between">
            <Form.Checkbox field="remember" noLabel className="text-gray-700">
              记住我
            </Form.Checkbox>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-300"
              >
                忘记密码？
              </a>
            </div>
          </div>

          <Button
            theme="solid"
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-300"
          >
            登录
          </Button>
        </Form>
      </div>
    </div>
  )
}

export default Login
