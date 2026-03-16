import Banner from './components/Banner'
import Features from './components/Features'
import Courses from './components/Courses'
import Reasons from './components/Reasons'
import Languages from './components/Languages'
import Feedbacks from './components/Feedbacks'

const Home = () => {
  return (
    <div>
      <Banner />
      <div id="reasons">
        <Reasons />
      </div>
      <div id="features">
        <Features />
      </div>
      <div id="languages">
        <Languages />
      </div>
      <div id="courses">
        <Courses />
      </div>
      <div id="feedbacks">
        <Feedbacks />
      </div>
    </div>
  )
}

export default Home
