jest.mock('../../../routes/v1/auth.routes', () => 'mock-auth-routes');
jest.mock('../../../routes/v1/user.routes', () => 'mock-user-routes');

describe('V1 API Routes', () => {
  const mockRouter = {
    use: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      jest.mock('express', () => ({
        Router: jest.fn().mockImplementation(() => mockRouter),
      }));
      
      require('../../../routes/v1/index');
    });
  });

  it('should configure auth routes correctly', () => {
    expect(mockRouter.use).toHaveBeenCalledWith('/auth', 'mock-auth-routes');
    expect(mockRouter.use).toHaveBeenCalledWith('/user', 'mock-user-routes');
  });
}); 