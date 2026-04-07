import React, { useState } from 'react'
import { Banner, Button, Form } from '@douyinfe/semi-ui'
import { useNavigate } from 'react-router-dom'
import { register, saveAuthData } from '@/api/auth'
import type { RegisterParams } from '@/api/auth'

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const onSubmit = async (values: RegisterParams) => {
    setLoading(true)
    setError(null)

    try {
      const response = await register(values)
      saveAuthData(response.token, response.userInfo)
      // 触发登录事件，通知其他组件更新状态
      window.dispatchEvent(new Event('authChange'))
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试')
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
                  window.scrollTo({ top: 0, behavior: 'instant' })
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
          <Banner
            fullMode={false}
            bordered
            type="danger"
            title="注册错误"
            description={error}
            closeIcon={null}
            className="mb-4"
          />
        )}

        <Form
          onSubmit={(values: RegisterParams, e: any) => {
            e?.preventDefault()
            onSubmit(values)
          }}
          className="mt-8 space-y-6 animate-fade-in"
        >
          <Form.Input
            field="username"
            noLabel
            placeholder="请输入用户名"
            className="rounded-lg"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少需要3个字符' },
            ]}
          />

          <Form.Input
            field="email"
            noLabel
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
            placeholder="请设置密码"
            className="rounded-lg"
            rules={[
              { required: true, message: '请设置密码' },
              { min: 6, message: '密码至少需要6个字符' },
            ]}
          />

          <Form.Input
            field="confirmPassword"
            noLabel
            mode="password"
            placeholder="请确认密码"
            className="rounded-lg"
            validate={(value, values) => {
              if (!value) {
                return '请确认密码'
              }
              if (value !== values.password) {
                return '两次输入的密码不一致'
              }
              return ''
            }}
          />

          <Button
            theme="solid"
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-300"
          >
            注册
          </Button>
        </Form>
      </div>
    </div>
  )
}

export default Register
