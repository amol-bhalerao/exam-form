import swaggerJSDoc from 'swagger-jsdoc';
export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HSC Exam Form API',
            version: '0.1.0'
        }
    },
    apis: ['src/routes/**/*.ts']
});
