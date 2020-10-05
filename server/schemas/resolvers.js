const { AuthenticationError } = require('apollo-server-express');
const { Thought, User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    thoughts: async (_, { username }) => {
      const params = username ? { username } : {};
      return Thought.find(params).sort({ createdAt: -1 });
    },

    thought: async (_, { _id }) => {
      return Thought.findOne({ _id });
    },

    me: async (_, _args, ctx) => {
      if (!ctx.user) {
        throw new AuthenticationError('Not logged in');
      }

      const userData = await User.findById(ctx.user._id)
        .select('-__v -password')
        .populate('thoughts')
        .populate('friends');

      return userData;
    },

    users: async () => {
      return User.find()
        .select('-__v -password')
        .populate('friends')
        .populate('thoughts');
    },

    user: async (_, { username }) => {
      return User.findOne({ username })
        .select('-__v -password')
        .populate('friends')
        .populate('thoughts');
    },
  },

  Mutation: {
    addUser: async (_, args) => {
      const user = await User.create(args);
      const token = signToken(user);

      return { user, token };
    },

    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);

      return { user, token };
    },

    addThought: async (_, args, ctx) => {
      if (!ctx.user) {
        throw new AuthenticationError('You need to be logged in!');
      }

      const thought = await Thought.create({
        ...args,
        username: ctx.user.username,
      });

      await User.findByIdAndUpdate(
        { _id: ctx.user._id },
        { $push: { thoughts: thought._id } },
        { new: true }
      );

      return thought;
    },

    addReaction: async (_, { thoughtId, reactionBody }, ctx) => {
      if (!ctx.user) {
        throw new AuthenticationError('You need to be logged in!');
      }

      const updatedThought = await Thought.findOneAndUpdate(
        { _id: thoughtId },
        { $push: { reactions: { reactionBody, username: ctx.user.username } } },
        { new: true, runValidators: true }
      );

      return updatedThought;
    },

    addFriend: async (_, { friendId }, ctx) => {
      if (!ctx.user) {
        throw new AuthenticationError('You need to be logged in!');
      }

      const updatedUser = await User.findOneAndUpdate(
        { _id: ctx.user._id },
        { $addToSet: { friends: friendId } },
        { new: true }
      ).populate('friends');

      return updatedUser;
    },
  },
};

module.exports = resolvers;
