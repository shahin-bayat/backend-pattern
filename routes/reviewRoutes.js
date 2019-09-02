const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });
// by doing mergeParams, not only router has access to is params, but has access to other router params. we need to add a middleware in tourRoutes. we are doing this for nested routes in tourRoutes for reviews
// POST /tour/234hfsfs/reviews
// POST /reviews
// the handler will work for both of above routes

// How to make this GET endpoint?
// GET /tour/234hfsfs/reviews

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
