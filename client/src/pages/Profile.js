import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/react-hooks';
import { QUERY_USER } from '../utils/queries';

import FriendList from '../components/FriendList';
import ThoughtList from '../components/ThoughtList';

const Profile = () => {
  const { username } = useParams();
  const { data, loading } = useQuery(QUERY_USER, {
    variables: { username },
  });

  const user = data?.user ?? {};

  return loading ? (
    <div>Loading...</div>
  ) : (
    <div className="flex-row justify-space-between mb-3">
      <div className="col-12 mb-3 col-lg-8">
        <ThoughtList
          thoughts={user.thoughts}
          title={`${user.username}'s thoughts...`}
        />
      </div>

      <div className="col-12 col-lg-3 mb-3">
        <FriendList
          username={user.username}
          friendCount={user.friendCount}
          friends={user.friends}
        />
      </div>
    </div>
  );
};

export default Profile;
