// review / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// preventing duplicate reviews using indexes
// combination of tour and user has always to be unique in reviews
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });
  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

// ! Static Methods
// we made static method cuz we wanted to call aggregate function on the model. in static methods the 'this' variable calls exactly to a method
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  // 'this' points to model
  // in aggregate we pass an array of all stages we want to aggregate
  // aggregate returns a promise
  const stats = await this.aggregate([
    {
      // first stage: matching - we pass our filter object { tour: tourId}
      $match: { tour: tourId }
    },
    {
      // calculating statistics
      $group: {
        // grouping by:
        _id: '$tour',
        // adding 1 for each tour we match
        nRating: { $sum: 1 },
        // the field we want to calculate average on is 'rating'
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  // console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

// ! Middlewares
// * DOCUMENT middleware
// we use post to access the review which is in db
// post does not have access to next()
reviewSchema.post('save', function() {
  // 'this' points to review that is being saved(current review)
  //  we can not use Review.calcAverageRatings while the model is not being yet created so we use a replacement which still points to Model: this.constructor
  // this.tour is equal the tour id we specified in the model(parent ref)
  this.constructor.calcAverageRatings(this.tour);
});

// * QUERY middleware
// findByIdAndUpdate
// findByIdAndDelete
// we can't use 'post' hook cuz then we don't have access to query itself!
reviewSchema.pre(/^findOneAnd/, async function(next) {
  // the goal is to access to review document but here with "find" we access to query and this variable point to query not document itself. how to access doc? executing the query and accessing the doc itself!
  this.r = await this.findOne();
  // trick: we use this.r instead of const r, cuz we want to pass it to next middleware!
  // console.log(this.r);
  next();
});

// now we use "post" hook. please note that await this.findOne() dows NOT work here
reviewSchema.post(/^findOneAnd/, async function() {
  // this.r is equivalent to this in first middleware in which we wanted to calculate average. this.constructor = this.r.constructor
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
