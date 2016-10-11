module.exports = {
    users: [
        {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            books: [
                {
                    id: 1,
                    title: 'Book Title',
                    author: {
                        id: 1,
                        firstName: 'John',
                        lastName: 'Doe'
                    }
                }
            ]
        },

        {
            id: 2,
            firstName: 'James',
            lastName: 'Doe',
            books: [
                {
                    id: 2,
                    title: 'Book Title',
                    author: {
                        id: 2,
                        firstName: 'James',
                        lastName: 'Doe'
                    }
                }
            ]
        }
    ]
}