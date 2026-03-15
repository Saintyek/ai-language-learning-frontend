import { Card, Row, Col, Statistic } from 'antd'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const LearningStats = () => {
  // 模拟学习数据
  const progressData = [
    { name: '第1周', 词汇量: 100, 语法: 80, 口语: 60 },
    { name: '第2周', 词汇量: 150, 语法: 120, 口语: 100 },
    { name: '第3周', 词汇量: 200, 语法: 160, 口语: 140 },
    { name: '第4周', 词汇量: 250, 语法: 200, 口语: 180 },
    { name: '第5周', 词汇量: 300, 语法: 240, 口语: 220 },
    { name: '第6周', 词汇量: 350, 语法: 280, 口语: 260 },
  ]

  const performanceData = [
    { name: '听力', 分数: 85 },
    { name: '口语', 分数: 78 },
    { name: '阅读', 分数: 92 },
    { name: '写作', 分数: 88 },
  ]

  const stats = [
    { title: '总学习时长', value: '120', suffix: '小时' },
    { title: '掌握词汇', value: '1,200', suffix: '个' },
    { title: '完成课程', value: '8', suffix: '门' },
    { title: '口语练习', value: '50', suffix: '次' },
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">学习效果数据可视化</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            实时跟踪您的学习进度，了解自己的优势和需要改进的地方
          </p>
        </div>

        {/* 统计数据卡片 */}
        <Row gutter={[16, 16]} className="mb-12">
          {stats.map((stat, index) => (
            <Col key={index} xs={12} sm={6}>
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  suffix={stat.suffix}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* 学习进度图表 */}
        <Row gutter={[16, 16]} className="mb-12">
          <Col xs={24} lg={12}>
            <Card title="学习进度趋势" className="shadow-sm">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="词汇量" stroke="#1677ff" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="语法" stroke="#52c41a" />
                    <Line type="monotone" dataKey="口语" stroke="#faad14" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* 能力评估图表 */}
          <Col xs={24} lg={12}>
            <Card title="能力评估" className="shadow-sm">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="分数" fill="#1677ff" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </section>
  )
}

export default LearningStats
