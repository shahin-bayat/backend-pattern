module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(err => next(err));
  };
};
/*  in order to get rid out try/catch block we simply wrapped async function inside a catchAsync function that we just created, this function will then return a new annonymous function which will then be assigned to createTour. basically this is this annonymous function that will get called as soon as a new tour should be created using the createTour handler. thats why it has exact the same (req,res,next). then this catchAsync function will call the fn (which is the whole async (req,res,next) => ... function) that we passed initially. this will return a promise because this is a async function, so if there is an error we can then catch that using the catch method which is available to all promises.
if we don't return an annonymous function and instead just executed fn inside catchAsync, it would then be immediately executed which is not the goal when we use async function.   */

// const catchAsync = fn => {
//   return (req, res, next) => {
//     fn(req, res, next).catch(err => next(err));
//   };
// };
