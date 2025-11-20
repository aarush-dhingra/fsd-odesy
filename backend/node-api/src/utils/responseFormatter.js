export const success = (res, data, message = 'OK') => {
  return res.json({ success: true, message, data });
};

export const failure = (res, message = 'Error', status = 400, extra = {}) => {
  return res.status(status).json({ success: false, message, ...extra });
};
