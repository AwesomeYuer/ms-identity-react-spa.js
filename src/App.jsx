import React, { useState , useEffect, useRef} from "react";
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import { PageLayout } from "./components/PageLayout";
import { ProfileData } from "./components/ProfileData";
import { callMsGraph } from "./graph";
import Button from "react-bootstrap/Button";
import "./styles/App.css";
import { useIsAuthenticated } from '@azure/msal-react';

import jwt_decode from 'jwt-decode';

/**
 * Renders information about the signed-in user or a button to retrieve data about the user
 */
const ProfileContent = () => {
    const { instance, accounts } = useMsal();
    const [graphData, setGraphData] = useState(null);
    const [userName, setUserName] = useState('');
 
    const isAuthenticated = useIsAuthenticated();
    
    useEffect(() => {
        if (isAuthenticated) {
           // go to an authenticated-only place
           setUserName(accounts[0].username);
           console.log("User is authenticated");
        } else {
          // go back to the public landing page where the user can try to login again
        }
     }, [isAuthenticated]);


    function RequestProfileData() {
        // Silently acquires an access token which is then attached to a request for MS Graph data
        instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0]
        }).then((response) => {
            callMsGraph(response.accessToken).then(response => setGraphData(response));
        });
    }

    // google

    const [isGSignedIn, setIsGSignedIn] = useState(false);
    const [userInfo, setUserInfo] = useState(null)
  
    const handleCredentialResponse = response => {
      setIsGSignedIn(true)
      const decodedToken = jwt_decode(response.credential)
      setUserInfo({...decodedToken})
      setUserName(decodedToken["email"]);
    }
  
    const googleButton = useRef(null);
  
    const initializeGSI = () => {
      google.accounts.id.initialize({
        client_id: '944301045116-usq3bf0h2algmn9g39gp34qobs82171v.apps.googleusercontent.com',
        cancel_on_tap_outside: false,
        //use_fedcm_for_prompt:true,
        callback: handleCredentialResponse
      });
  
      google.accounts.id.renderButton(
        googleButton.current, 
        { theme: 'outline', size: 'large' } 
      );
  
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.log(notification.getNotDisplayedReason())
        } else if (notification.isSkippedMoment()) {
          console.log(notification.getSkippedReason())
        } else if(notification.isDismissedMoment()) {
          console.log(notification.getDismissedReason())
        }
      });
    }
  
    const gSignOut = () => {
      // refresh the page
      window.location.reload();
    }
  
    useEffect(() => {
        const el = document.createElement('script')
        el.setAttribute('src', 'https://accounts.google.com/gsi/client')
        el.onload = () => initializeGSI();
        document.querySelector('body').appendChild(el)
      }, [])
  
    return (
        <>
            <h5 className="card-title">Welcome { userName }</h5>
            {graphData ? 
                <ProfileData graphData={graphData} />
                :
                <Button variant="secondary" onClick={RequestProfileData}>Request Profile Information</Button>
            }

            <div ref={googleButton}></div>
            
            { isGSignedIn && userInfo ?
            <div>
                Hello {userInfo.name} ({userInfo.email})
                <br />
                <button className="g_id_signout" onClick={() => gSignOut()}>Google Sign Out</button>
            </div> :
            <div>You are not signed in</div>
            }
        </>
    );
};

/**
 * If a user is authenticated the ProfileContent component above is rendered. Otherwise a message indicating a user is not authenticated is rendered.
 */
const MainContent = () => {    
    return (
        <div className="App">
           
                <ProfileContent />
           
        </div>
    );
};

export default function App() {
    return (
        <PageLayout>
            <MainContent />
        </PageLayout>
    );
}
