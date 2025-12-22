import React, { useEffect } from "react";
import { useState } from "react";
// set
const Sidebar = () => {
    // const [user, setuser] = useState("NULL");

    // useEffect(() => {
    //     const storedUser = JSON.parse(localStorage.getItem("user"));
    //     if (storedUser) {
    //         setuser(storedUser);
    //     }
    // }, [])

     const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) setUser(storedUser);
  }, []);


    return (
        <>
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="logo">
                    <div className="sidebar-logo">◎</div>
                    <div className="sidebar-logo-text">Psycho-Lotus</div>
                </div>
                <ul className="sidebar-menu">
                    <li className="active">Dashboard</li>
                    <li>AI Bot</li>
                    <li><a href="/patients/chat">Chat Room</a></li>
                </ul>
                <div className="sidebar-user">
                    {/* <img
            src=""
            alt="User"
            className="user-avatar"
          /> */}
                    <div>
                        {user ? (
                            <><p className="user-name">{user.name}</p><p className="user-email">{user.email}</p></>
                        ) : (
                            <><p className="user-name">Guest</p><p className="user-email">Empty Email</p></>
                        )}
                    </div>
                </div>
            </aside>
        </>
    )

}

export default Sidebar