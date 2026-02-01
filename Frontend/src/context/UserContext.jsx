import { createContext, useState, useContext, useEffect } from 'react'
import { getMe } from '../api/auth'

const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await getMe()
        if (response.success) {
          setUser(response.user)
        }
      } catch (error) {
        // Not authenticated
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
