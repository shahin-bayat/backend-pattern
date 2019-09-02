const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel.js');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal than 10 characters']
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      // setter fn which will run every time this field changes
      set: val => Math.round(val * 10) / 10 // 4.6666, 46.666, 47. 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          //! this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below the regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false //prevent from showing to user (passwords,...)
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON - object not options
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    // embedding:
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  // Options
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Creating Indexes to make querying faster
// to have clue add .explain() method to query in handlerFactory
// single index:
// tourSchema.index({ price: 1 });
// compound index:
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// VIRTUAL PROPERTY: will not be saved in db (should be specified in schema as Option)
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// VIRTUAL POPULATE
// basically it is like child referencing without actually persisting data into db.
// we have to add .populate('reviews') in tourController.getTour
tourSchema.virtual('reviews', {
  ref: 'Review',
  // the field in the foreign model(Review) which reference to this model(Tour) is stored: 'tour' inside 'reviewModel'
  foreignField: 'tour',
  // where is tour saved in this local model? _id
  localField: '_id'
});

// ! MIDDLEWARES
// * DOCUMENT MIDDLEWARE: runs before the .save() and .create() command
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// this is not a good idea for this situation, child referencing is better
// for embedding the guides in model should be just Array guides: Array
// tourSchema.pre('save', async function(next) {
//   // embedding model
//   // this.guides is an array of user IDs we enter when we want to create a tour
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   // we use promise.all because the result of above mapping is a promise [array full of promises]
//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

// for testing:
// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// * QUERY MIDDLEWARE
// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });

  // checking how much it takes (see next hook)
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  // 'this' point to current query
  // we added populate for child referencing - replacing ids with actual data in 'guides'
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });

  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`⌛ Query took: ${Date.now() - this.start} milliseconds! ⌛`);
  next();
});

// * AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline);
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
