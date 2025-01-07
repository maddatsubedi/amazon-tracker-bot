const availableDropDays = [ 43, 43, 43 ]
const availabeDropWeeks = [ 10, 10, 10 ]
const availableDropMonths = [ 7, 3, 7 ]

const checkDealEffectiveness = (dropDays, dropWeeks, dropMonths) => {
    const averageDropDays = dropDays.reduce((acc, dropDay) => acc + dropDay) / dropDays.length
    const averageDropWeeks = dropWeeks.reduce((acc, dropWeek) => acc + dropWeek) / dropWeeks.length
    const averageDropMonths = dropMonths.reduce((acc, dropMonth) => acc + dropMonth) / dropMonths.length

    return {
        averageDropDays,
        averageDropWeeks,
        averageDropMonths
    }
}

module.exports = {
    checkDealEffectiveness
}