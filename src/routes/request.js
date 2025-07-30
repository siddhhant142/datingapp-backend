const express = require("express");
const requestRouter = express.Router();
const { userAuth } = require("../Middlewares/auth");
const { ConnectionRequestModel } = require("../Models/connectionRequest");
const User = require("../Models/user");


//sending request to someone so only two status either intersetd or ignore
requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const user = req.user;
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      //toUser exist check
      const toUser = await User.findById(toUserId);
      if (!toUser) {
        return res.status(400).json({
          message: "User not found",
          success: false,
        });
      }

      //Status Check
      const allowedStatuses = ["ignored", "intrested"];
      if (!allowedStatuses.includes(status)) {
        throw new Error("Invalid status type:" + status);
      }

      //Existing user exist check ,check connection request from A to B already sent or connection request from B to A already pending
      const existingConnectionRequest = await ConnectionRequestModel.findOne({
        $or: [
          //we search in connecttion request model
          // fromuserid is akshy and touser id is elon first case is akshay has already send request to elon second case is in pending request elon has already sent request to akshay
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });
      console.log(existingConnectionRequest);
      if (existingConnectionRequest) {
        throw new Error("Already sent the connection request before");
      }

      const connectionRequest = new ConnectionRequestModel({
        fromUserId,
        toUserId,
        status,
      });

      const data = await connectionRequest.save();
      res.status(200).json({
        message: user.firstName + " is " + status + " in " + toUser.firstName,
        data,
        success: true,
      });
    } catch (error) {
      res.status(400).json({
        message: error.message,
      });
    }
  }
);


// request ko accept ya reject krne k baad kya krna hai vo api hai ye , requestId is jisne mujhe request bheji hai,reciever should be logged in person
//review me vhi request hogi jo intersted hoga status
requestRouter.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const { status, requestId } = req.params;

      //Validate Status
      const allowedStatuses = ["accepted", "rejected"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid Status or Status not allowed",
          success: false,
        });
      }

      //validating the request
      const connectionRequest = await ConnectionRequestModel.findOne({
        _id: requestId,
        toUserId: loggedInUser._id,
        status: "intrested",
      });

      if (!connectionRequest) {
        return res.status(404).json({
          message: "request not found ",
          success: false,
        });
      }

      //agar jo connection request exist krti hai, jise humne oopr validate kiya hai uske intersted status me accepted ya rejected dalna api se le k
      connectionRequest.status = status;
      const data = await connectionRequest.save();

      res.status(200).json({
        message: "Connection request " + status,
        data,
        success: true,
      });
    } catch (error) {
      res.status(400).send("ERROR:" + error.message);
    }
  }
);

module.exports = requestRouter;
