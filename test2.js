const test = () => {
    const discountRanges = [
        {
            range: '40-60',
            channelID: '1322830219727343666',
            roleID: '1322830705880862731'
        },
        {
            range: '60-80',
            channelID: '1322830219727343666',
            roleID: '1322830767142731847'
        },
        {
            range: '80-100',
            channelID: '1322830219727343666',
            roleID: '1322830811640102923'
        },
        {
            range: '20-40',
            channelID: '1322830219727343666',
            roleID: '1322831870135631872'
        }
    ];

    const drop = 27;

    const range = discountRanges.find(range => {
        const [i, f] = range.range.split('-').map(Number);
        return drop >= i && drop < f;
    });

    console.log(range);

}

test();