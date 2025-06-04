module.exports = {
    PORT: process.env.PORT || 5000,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/menstrualcare',
    JWT_SECRET: process.env.JWT_SECRET || 'menstrualcare_secret_key_2024',
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '24h'
}; 