
module.exports = status => {
    switch (status) {
        case 'pending':
            return 0;
        case 'accepted':
            return 1;
        case 'waiting':
            return 2;
        case 'blocked':
        default:
            return 3;
    }
}