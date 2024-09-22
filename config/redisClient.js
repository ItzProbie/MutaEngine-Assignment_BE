const Redis = require('ioredis');

const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASS,

    retryStratergy: times => Math.min(times * 50 , 2000),
});

redisClient.on('connect' , () => {
    console.log("Connected to Redis");
})

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});

module.exports = redisClient;