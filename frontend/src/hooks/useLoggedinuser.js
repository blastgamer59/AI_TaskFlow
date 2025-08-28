import { useEffect, useState } from "react";
import { useUserAuth } from "./useAuth";

const useLoggedinuser = () => {
  const { user } = useUserAuth();
  const email = user?.email;
  const [loggedinuser, setLoggedinuser] = useState(null);

  useEffect(() => {
    if (!email) return;

    const fetchUser = async () => {
      try {
        const response = await fetch(`https://ai-taskflow-ks8s.onrender.com/loggedinuser?email=${email}`);
        const data = await response.json();
        setLoggedinuser(data[0] || {});
      } catch (error) {
        console.error("Error fetching logged-in user:", error);
        setLoggedinuser({});
      }
    };

    fetchUser();
  }, [email]);

  return [loggedinuser, setLoggedinuser];
};

export default useLoggedinuser;
