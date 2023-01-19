function parser(data, lang) {
    const table = $.parseHTML(data);

    let title = [];
    $(table[13]).find('th').each((index, th) => {
        title.push(th.textContent);
    });

    let value = [];
    $(table[13]).find('td').each((index, td) => {
        value.push(td.textContent !== '' ? td.textContent : '---');
    });

    let output = [];
    const year = new Date().getFullYear() - 2000;
    for (let [i, item] of title.entries()) {
        // convert date to YYYY-MM-DD (weird because from metadata, it is the format it should be)
        // inside the response it is dd-mm-yy
        if (i === 36 | i === 37) {
            // get date portion
            let arr = value[i].split(' ')[0].split('/');

            // loop to pad DD and MM
            for (let [j, date] of arr.entries()) {
                arr[j] = date.padStart(2, 0);

                // For year, check if we need to add 19 or 20
                if (j === 2) {

                    arr[j] = (arr[j] <= year) ? `20${arr[j]}` : `19${arr[j]}`;
                }
            }
            value[i] = arr.reverse().join('-');
        }

        let tmp = {
            title: item,
            value: value[i]
        };
        output.push(tmp);
    }

    const inter = setInterval(() => {
        $('#bcDetails').css('opacity', 1).css('height', 'auto');
        clearInterval(inter);
    }, 1000);

    if (output.length === 0) output[0] = { title: (lang === 'en-CA') ? 'Nothing found' : 'Aucun rÃ©sultat' };

    return { items: output };
}