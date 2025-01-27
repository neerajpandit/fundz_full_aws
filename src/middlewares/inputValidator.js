import Joi from 'joi';

const registrationSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    'string.base': 'Name must be a string.',
    'string.min': 'Name must be at least 3 characters long.',
    'string.max': 'Name must be at most 50 characters long.',
    'any.required': 'Name is required.',
  }),

  email: Joi.string().email().required().messages({
    'string.base': 'Email must be a string.',
    'string.email': 'Please provide a valid email address.',
    'any.required': 'Email is required.',
  }),

  password: Joi.string().min(6).required().messages({
    'string.base': 'Password must be a string.',
    'string.min': 'Password must be at least 6 characters long.',
    'any.required': 'Password is required.',
  }),

  role: Joi.string().valid('admin', 'employee', 'user').default('employee').messages({
    'string.base': 'Role must be a string.',
    'any.only': 'Role must be one of "admin", "employee", or "user".',
    'any.required': 'Role is required.',
  })
});

export const validateRegistration = (req, res, next) => {
  const { error } = registrationSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  next();
};


const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.base': 'Email must be a string.',
    'string.email': 'Please provide a valid email address.',
    'any.required': 'Email is required.',
  }),

  password: Joi.string().min(6).required().messages({
    'string.base': 'Password must be a string.',
    'string.min': 'Password must be at least 6 characters long.',
    'any.required': 'Password is required.',
  })
});

export const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  next();
};



const fundHouseSchema = Joi.object({
  name: Joi.string()
    .max(255)
    .required()
    .messages({
      'string.base': 'Name must be a string.',
      'string.max': 'Name cannot exceed 255 characters.',
      'any.required': 'Name is required.',
    }),
  
  logo_url: Joi.string()
    .uri()
    .required()
    .messages({
      'string.base': 'Logo URL must be a string.',
      'string.uri': 'Logo URL must be a valid URL.',
      'any.required': 'Logo URL is required.',
    }),
});

export const validateFundHouse = (req, res, next) => {
  const { error } = fundHouseSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: 'Validation failed.',
      details: error.details.map(err => err.message),
    });
  }

  next();
};



const schemeSchema = Joi.object({
  scheme_code: Joi.string()
    .max(100)
    .required()
    .messages({
      'string.base': 'Scheme code must be a string.',
      'string.max': 'Scheme code cannot exceed 100 characters.',
      'any.required': 'Scheme code is required.',
    }),

  scheme_name: Joi.string()
    .max(255)
    .required()
    .messages({
      'string.base': 'Scheme name must be a string.',
      'string.max': 'Scheme name cannot exceed 255 characters.',
      'any.required': 'Scheme name is required.',
    }),

  aum: Joi.number()
    .precision(2)
    .min(0)
    .required()
    .messages({
      'number.base': 'AUM must be a numeric value.',
      'number.min': 'AUM cannot be negative.',
      'number.precision': 'AUM must have up to 2 decimal places.',
      'any.required': 'AUM is required.',
    }),

  about: Joi.string()
    .allow(null, '')
    .messages({
      'string.base': 'About must be a string.',
    }),

  status: Joi.string()
    .max(50)
    .required()
    .messages({
      'string.base': 'Status must be a string.',
      'string.max': 'Status cannot exceed 50 characters.',
      'any.required': 'Status is required.',
    }),

  fundhouse_id: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'FundHouse ID must be a numeric value.',
      'number.integer': 'FundHouse ID must be an integer.',
      'any.required': 'FundHouse ID is required.',
    }),
});

export const validateScheme = (req, res, next) => {
  const { error } = schemeSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: 'Validation failed.',
      details: error.details.map(err => err.message),
    });
  }

  next();
};


const blogSchema = Joi.object({
  title: Joi.string()
    .max(255)
    .required()
    .messages({
      'string.base': 'Title must be a string.',
      'string.max': 'Title cannot exceed 255 characters.',
      'any.required': 'Title is required.',
    }),

  content: Joi.string()
    .required()
    .messages({
      'string.base': 'Content must be a string.',
      'any.required': 'Content is required.',
    }),

  author_id: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'Author ID must be a numeric value.',
      'number.integer': 'Author ID must be an integer.',
      'any.required': 'Author ID is required.',
    }),

  tags: Joi.array()
    .items(Joi.string())
    .optional()
    .messages({
      'array.base': 'Tags must be an array of strings.',
    }),

  category: Joi.string()
    .max(100)
    .optional()
    .allow(null, '')
    .messages({
      'string.base': 'Category must be a string.',
      'string.max': 'Category cannot exceed 100 characters.',
    }),

  status: Joi.string()
    .valid('draft', 'published')
    .default('draft')
    .messages({
      'string.base': 'Status must be a string.',
      'any.only': 'Status must be either "draft" or "published".',
    }),

  featured_image: Joi.string()
    .uri()
    .optional()
    .allow(null, '')
    .messages({
      'string.base': 'Featured image must be a string.',
      'string.uri': 'Featured image must be a valid URL.',
    }),

  views: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.base': 'Views must be a numeric value.',
      'number.integer': 'Views must be an integer.',
      'number.min': 'Views cannot be negative.',
    }),

  likes: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.base': 'Likes must be a numeric value.',
      'number.integer': 'Likes must be an integer.',
      'number.min': 'Likes cannot be negative.',
    }),
});

export const validateBlog = (req, res, next) => {
  const { error } = blogSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: 'Validation failed.',
      details: error.details.map(err => err.message),
    });
  }

  next();
};