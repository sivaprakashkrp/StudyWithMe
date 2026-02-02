import React, { useEffect, useState } from 'react'

const Navbar = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth > 768 ? false : true);
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
        <div className="right w-2/5 md:w-1/3 relative">
          {isMobile ? <MobileNavbar /> : <NavLinks classlist={""} />}
        </div >
      </nav >
    </React.Fragment >
  )
}

const MobileNavbar = () => {
  const [menuIsVisible, setMenuIsVisible] = useState(false)
  return (
    <React.Fragment>
      <NavLinks classlist={`${menuIsVisible ? "block" : "hidden"} absolute top-8 right-0 bg-swm-blue text-xl gap-5 p-5 rounded-b-xl`} />
      <button className="absolute right-5 -top-4 text-white font-days text-2xl font-bold" onClick={() => setMenuIsVisible(!menuIsVisible)}>{!menuIsVisible ? "☰" : "X"}</button>
    </React.Fragment>
  )
}

const NavLinks = ({ classlist }) => {
  return (
    <React.Fragment>
      <ul className={`flex flex-col md:flex-row w-full justify-between items-center px-6 ${classlist}`}>
        <li className="nav-links"><a href="/">Home</a></li>
        <li className="nav-links"><a href="/about">About</a></li>
        <li className="nav-links"><a href="/signup">Sign Up</a></li>
      </ul>
    </React.Fragment>
  )
}

export default Navbar