import React from 'react'
import Navbar from '../components/Navbar'
import {login_img, signup_img} from '../assets'

const Login = () => {
  return (
    <React.Fragment>
      <Navbar />
      <div className="content grid grid-cols-1 lg:grid-cols-2 justify-between items-center min-h-[90vh]">
        <div className="left w-full">
          <h1 className="font-days text-4xl text-center p-5">Welcome Back</h1>
          <LoginForm />
          <p className="text-center font-days p-2 text-sm font-light">Don't have an Account yet? <a className='text-swm-blue underline ' href="/signup">Sign Up</a></p>
        </div>
        <div className="right bg-blue-200 h-[90vh] hidden lg:flex justify-center items-center">
          <img src={login_img} alt="Login Image" className='w-[90%]' />
        </div>
      </div>
    </React.Fragment>
  )
}

const LoginForm = () => {
  return (
    <React.Fragment>
      <form action="" className="flex flex-col justify-center items-center text-black font-days w-4/5 lg:w-3/5 mx-auto border-2 border-swm-blue rounded-xl bg-blue-100 p-8">
        <div className="input-field">
          <label htmlFor="username">Username</label>
          <input type="text" id="username" required/>
        </div>
        <div className="input-field">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" required />
        </div>
        <button type="submit" className='bg-swm-blue text-white cursor-pointer px-3 py-2 rounded-xl border-2 border-swm-blue hover:bg-transparent hover:text-swm-blue transition-colors'>Sign In</button>
      </form>
    </React.Fragment>
  )
}

export default Login
