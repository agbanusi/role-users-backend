// load Joi module
const Joi = require('joi');

const name = Joi.string().regex(/^[A-Z]+$/).uppercase();

const personDataSchema = Joi.object().keys({
  firstName: name.required(),
  lastName: name.required(),
  email: Joi.string().email().required(),
  phone: Joi.string().regex(/^\d{3}-\d{3}-\d{4}$/),
  password: Joi.string().min(7).required().strict(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().strict(),
  role: Joi.string().valid('ADMIN', 'USER').uppercase().required(),
})

const authDataSchema = Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().min(7).required().strict()
})

const singleUserSchema= Joi.object().keys({
    token: Joi.string().required(),
})

const deleteUserSchema= Joi.object().keys({
    token: Joi.string().required(),
    email: Joi.string().email()
})

const allUsersSchema= Joi.object().keys({
    page: Joi.string().regex(/\d/),
    search: Joi.string(),
    sort: Joi.string().valid('ASC', 'DESC').uppercase(),
    toDate: Joi.string().regex(/^\d{2}-\d{2}-\d{4}$/),
    fromDate: Joi.string().regex(/^\d{2}-\d{2}-\d{4}$/)
})


// export the schemas
module.exports = {
    '/registerUser': personDataSchema,
    '/loginUser': authDataSchema,
    '/getSingleUser': singleUserSchema,
    '/deleteUser': deleteUserSchema,
    '/getSingleUser': allUsersSchema
  };