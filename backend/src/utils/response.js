/**
 * Standardized API response helpers
 */

const success = (res, data, meta = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    data,
    meta: {
      requestId: res.req.requestId,
      ...meta,
    },
  });
};

const created = (res, data, meta = {}) => success(res, data, meta, 201);

const paginated = (res, data, { page, limit, total }) => {
  return res.status(200).json({
    data,
    meta: {
      requestId: res.req.requestId,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
};

const noContent = (res) => res.status(204).send();

module.exports = { success, created, paginated, noContent };
