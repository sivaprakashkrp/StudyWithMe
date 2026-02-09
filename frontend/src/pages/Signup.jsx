import React from 'react'
import Navbar from '../components/Navbar'
import '../css/signup.css'

const Signup = () => {
  return (
    <React.Fragment>
      <Navbar />
      <MainBody />
    </React.Fragment>
  )
}

const MainBody = () => {
  return (
    <>
      <div class="main">
        <div class="main-left">
          <img src="your-image.png" alt="study"/>
        </div>

        <div class="main-right">

          <div class="form-card">
            <label>Email</label>
            <input type="email"/>

              <label>Username</label>
              <input type="text"/>

                <label>Password</label>
                <input type="password"/>

                  <button>Sign Up</button>
          </div>

                <p class="login-text">
                  Have an Account already?  <span>Sign In</span>
                </p>
        </div>
      </div>
        </>)
}

        export default Signup
