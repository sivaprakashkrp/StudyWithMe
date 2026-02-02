import React, { useEffect, useState } from 'react'

const Navbar = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    }
  })
  return (
    <React.Fragment>
      <nav className="w-screen h-16 flex justify-between items-center bg-swm-blue text-white font-days">
        <div className="left text-2xl px-3 md:text-3xl">
          <h1 className="">Study With Me</h1>
        </div>
        <div className="right w-1/3">
          {isMobile ? () => {
            return (
              <div className="">Hello there</div>
            )
          } : <NavLinks />
          }
        </div >
      </nav >
    </React.Fragment >
  )
}

const NavLinks = () => {
  return (
    <React.Fragment>
      <ul className="flex flex-col md:flex-row w-full justify-between items-center px-6">
        <li className="nav-links"><a href="/">Home</a></li>
        <li className="nav-links"><a href="/about">About</a></li>
        <li className="nav-links"><a href="/signup">Sign Up</a></li>
      </ul>
    </React.Fragment>
  )
}

export default Navbar