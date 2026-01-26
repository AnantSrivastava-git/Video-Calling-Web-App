export const catchAsync = (fn) => (req, res, next) => {
    return Promise(fn()).catch((err) => next(err))
}

const service = (num1, num2) => {
    return num1 + num2
} // classic leet code

export const roomMakerController = catchAsync(async (req, res, next) => {
    const {num1, num2} = req.body;
    if (num1, num2) {
        throw new AppError(401, "something") // 500
    }

    const ans = service(num1, num2);
    res.status(200).json({
        ans
    })
})

class AppError extends Error {
    statusCode
    constructor(statusCode, msg) {
        super(msg)
        this.statusCode = statusCode
    }
}