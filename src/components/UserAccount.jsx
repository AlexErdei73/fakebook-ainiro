import React, { useEffect, useState } from "react";
import TitleBar from "./Titlebar";
import Profile from "./Profile";
import PhotoViewer from "./PhotoViewer";
import HomePage from "./HomePage";
import FriendsListPage from "./FriendsListPage";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import Container from "react-bootstrap/Container";
import { useDispatch, useSelector } from "react-redux";
import {
  currentUserOffline,
  currentUserOnline,
  subscribeCurrentUser,
  subscribeUsers,
  subscribePosts,
} from "../backend/backend";
import {
  friendsListPageSet,
  profileLinkSet,
  watchSet,
} from "../features/accountPage/accountPageSlice";

const UserAccount = (props) => {
  let profileLink = useSelector((state) => state.accountPage.profileLink);

  const currentUser = useSelector((state) => state.currentUser);
  const users = useSelector((state) => state.users);
  const isFriendsListPage = useSelector(
    (state) => state.accountPage.isFriendsListPage
  );

  const dispatch = useDispatch();

  useEffect(() => {
    subscribeCurrentUser();
    const unsubscribeUsers = subscribeUsers();
    const unsubscribePosts = subscribePosts();
    //We make currentUser online
    currentUserOnline();
    //We add event listener for the event when the user closes the browser window
    const handleUnload = () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user?.id && user?.token) {
        currentUserOfflineBeacon(user.id, user.token);
      }
      localStorage.setItem("lastActivity", Date.now().toString());
    };
  
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("unload", handleUnload);
    //we add event listener for the event when the browser window change visibility
    const visibilitychangeListener = (e) => {
      if (document.visibilityState === "visible") currentUserOnline();
      else currentUserOffline();
    };
    document.addEventListener("visibilitychange", visibilitychangeListener);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("unload", handleUnload);
      unsubscribeUsers();
      unsubscribePosts();
    };
  }, []);

  //We add the index of user to the profileLink if there are more users with the exact same userName
  const addIndexToProfileLink = () => {
    if (currentUser && currentUser.index && currentUser.index > 0) {
      return `/fakebook-ainiro/${currentUser.lastname}.${currentUser.firstname}.${currentUser.index}`;
    } else
      return `/fakebook-ainiro/${currentUser.lastname}.${currentUser.firstname}`;
  };

  //dispatch(profileLinkSet(newProfileLink));
  useEffect(() => {
    profileLink = addIndexToProfileLink();
    dispatch(profileLinkSet(profileLink));
  }, [dispatch, profileLink, currentUser]);

  if (users.length === 0 || !currentUser) {
    return <div>...Loading</div>;
  }

  return (
    <div className='bg-200 vw-100 main-container overflow-hidden'>
      <Container className='w-100 p-0' fluid>
        <BrowserRouter>
          <TitleBar />
          <Switch>
            <Route
              path='/fakebook-ainiro/friends/list'
              render={() => {
                dispatch(friendsListPageSet(true));
                return <FriendsListPage />;
              }}
            />
            <Route
              path={`/fakebook-ainiro/photo/:userID/:n`}
              render={() => <PhotoViewer />}
            />
            <Route
              path='/fakebook-ainiro/watch'
              render={() => {
                dispatch(friendsListPageSet(false));
                dispatch(watchSet(true));
                return <HomePage className='pt-5' />;
              }}
            />
            <Route
              path={`/fakebook-ainiro/:userName`}
              render={() => {
                if (isFriendsListPage) return <FriendsListPage />;
                else {
                  return <Profile />;
                }
              }}
            />
            <Route
              path='/fakebook-ainiro'
              render={() => {
                dispatch(friendsListPageSet(false));
                dispatch(watchSet(false));
                return <HomePage className='pt-5' />;
              }}
            />
          </Switch>
        </BrowserRouter>
      </Container>
    </div>
  );
};

export default UserAccount;
