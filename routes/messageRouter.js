var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var Message = require('../models/message');
var Verify = require('./verify');

var messageRouter = express.Router();
messageRouter.use(bodyParser.json());

messageRouter.route('/')
    .get(Verify.verifyOrdinaryUser, function (req, res, next) {
        var limit = Math.abs(req.query.limit*1);
        var page = Math.abs(req.query.page*1);
        limit = limit?limit:2;
        page = page?page:1;
        var query = {};
        var options = {
            // select:   'title date author',
            // sort:     { date: -1 },
            populate: 'comments.commentBy',
            lean: true,
            page: page,
            limit: limit
        };
        Message.paginate(query, options).then(function (result) {
            res.json({
                messages: result.docs,
                meta: {
                    pagination: {
                        total: result.total,
                        limit: result.limit,
                        pages: result.pages,
                        page: result.page
                    }
                }
            });
        });
        // Message.find({})
        //     .populate('comments.commentBy')
        //     .exec(function (err, msg) {
        //         if (err) throw err;
        //         res.json(msg);
        //     });
    })

    .post(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function (req, res, next) {
        req.body.message.postedBy = req.decoded._doc._id;
        Message.create(req.body.message, function (err, msg) {
            if (err) throw err;
            console.log('Message created!');
            var id = msg._id;
            // res.writeHead(200, {
            //     'Content-Type': 'application/json'
            // });

            res.status(201).json({"message": "Added the message with id: " + id});
        });
    })

    .delete(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function (req, res, next) {
        Message.remove({}, function (err, resp) {
            if (err) throw err;
            res.json(resp);
        });
    });

messageRouter.route('/:msgId')
    .get(Verify.verifyOrdinaryUser, function (req, res, next) {
        Message.findById(req.params.msgId)
            .populate('comments.commentBy', 'username')
            // .populate('comments.commentBy')
            .exec(function (err, msg) {
                if (err) throw err;
                res.json({message: msg});
            });
    })

    .put(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function (req, res, next) {
        Message.findByIdAndUpdate(req.params.msgId, {
            $set: req.body.message
        }, {
            new: true // return updated entity
        }, function (err, msg) {
            if (err) throw err;
            console.log(msg);
            res.json(msg);
        });
    })

    .delete(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function (req, res, next) {
        Message.findByIdAndRemove(req.params.msgId, function (err, resp) {
            if (err) throw err;
            res.json(resp);
        });
    });

messageRouter.route('/:msgId/comments')
    .all(Verify.verifyOrdinaryUser)

    .get(function (req, res, next) {
        Message.findById(req.params.msgId)
            .populate('comments.commentBy')
            .exec(function (err, msg) {
                if (err) throw err;
                res.json(msg.comments);
            });
    })

    .post(function (req, res, next) {
        Message.findById(req.params.msgId, function (err, msg) {
            if (err) throw err;
            req.body.commentBy = req.decoded._doc._id;
            msg.comments.push(req.body);
            msg.save(function (err, msg) {
                if (err) throw err;
                console.log('Updated Comments!');
                res.json(msg);
            });
        });
    })

    .delete(Verify.verifyAdmin, function (req, res, next) {
        Message.findById(req.params.msgId, function (err, msg) {
            if (err) throw err;
            for (var i = (msg.comments.length - 1); i >= 0; i--) {
                msg.comments.id(msg.comments[i]._id).remove();
            }
            msg.save(function (err, result) {
                if (err) throw err;
                res.writeHead(200, {
                    'Content-Type': 'text/plain'
                });
                res.end('Deleted all comments!');
            });
        });
    });

messageRouter.route('/:msgId/comments/:commentId')
    .all(Verify.verifyOrdinaryUser)

    .get(function (req, res, next) {
        Message.findById(req.params.msgId)
            .populate('comments.commentBy')
            .exec(function (err, msg) {
                if (err) throw err;
                res.json(msg.comments.id(req.params.commentId));
            });
    })

    .put(function (req, res, next) {
        // We delete the existing commment and insert the updated
        // comment as a new comment
        Message.findById(req.params.msgId, function (err, msg) {
            if (err) throw err;
            msg.comments.id(req.params.commentId).remove();
            req.body.commentBy = req.decoded._doc._id;
            msg.comments.push(req.body);
            msg.save(function (err, msg) {
                if (err) throw err;
                console.log('Updated Comments!');
                res.json(msg);
            });
        });
    })

    .delete(function (req, res, next) {
        Message.findById(req.params.msgId, function (err, msg) {
            if (msg.comments.id(req.params.commentId).postedBy
                != req.decoded._doc._id) {
                var err = new Error('You are not authorized to perform this operation!');
                err.status = 403;
                return next(err);
            }
            msg.comments.id(req.params.commentId).remove();
            msg.save(function (err, resp) {
                if (err) throw err;
                res.json(resp);
            });
        });
    });

module.exports = messageRouter;