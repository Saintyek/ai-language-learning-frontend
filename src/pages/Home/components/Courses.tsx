import { Card, Button } from '@douyinfe/semi-ui-19'

interface CourseItem {
  title: string
  description: string
  level: string
  duration: string
  image: string
}

const Courses = () => {
  const courses: CourseItem[] = [
    {
      title: '日常会话',
      description: '学习日常生活中最常用的对话，包括问候、购物、旅游等场景',
      level: '初级',
      duration: '4周',
      image:
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=language%20learning%20daily%20conversation%20scene&image_size=landscape_4_3',
    },
    {
      title: '商务英语',
      description: '掌握商务会议、邮件、谈判等场景的专业表达',
      level: '中级',
      duration: '6周',
      image:
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=business%20english%20meeting%20scene&image_size=landscape_4_3',
    },
    {
      title: '学术写作',
      description: '学习学术论文、报告等正式文体的写作技巧',
      level: '高级',
      duration: '8周',
      image:
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=academic%20writing%20study%20scene&image_size=landscape_4_3',
    },
    {
      title: '旅游英语',
      description: '为出国旅游准备的实用英语，包括订酒店、问路、点餐等',
      level: '初级',
      duration: '3周',
      image:
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=travel%20english%20tourist%20scene&image_size=landscape_4_3',
    },
  ]

  return (
    <section className="pt-36 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">精心设计的课程体系</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            根据不同水平和学习目标，为您提供个性化的课程内容
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {courses.map((course, index) => (
            <Card
              key={index}
              shadows="hover"
              className="overflow-hidden transition-shadow duration-300"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                    {course.level}
                  </span>
                  <span className="text-sm text-gray-500">{course.duration}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{course.title}</h3>
                <p className="text-gray-600 mb-4">{course.description}</p>
                <Button theme="outline" className="w-full text-blue-600 border-blue-600 hover:bg-blue-50">
                  查看详情
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Courses
