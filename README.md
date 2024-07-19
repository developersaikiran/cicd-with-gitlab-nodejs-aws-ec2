# CI/CD Demo
Gitlab with AWS EC2 instance


## Step 1: Create a GitLab Access Token
Create an access token in GitLab settings that will be used for CI/CD pipelines.


## Step 2: Define Variables in GitLab Settings
Define the following variables in GitLab project settings under CI/CD:
    
- **AWS_HOST:** ec2-52-205-218-228.ap-south-1.compute.amazonaws.com (Public IPv4 DNS)
- **AWS_PRIVATE_KEY:** (Copy and paste the content of your `.pem` file)
- **AWS_PUBLIC_IP:** 52.205.218.228 (Public IPv4 address)
- **AWS_USERNAME:** ubuntu


## Step 3: Set Up Environment and Runner
1. Create a shell script for running the deployment steps:
    ```
    nano script-runner.sh
    chmod +x script-runner.sh
    ``` 
    ![alt text](assets/image1.png)
    ![alt text](assets/image2.png)

    Copy and paste the code it will automatically download and install required dependencies for gitlab-runner

2. Execute the script:
    ```
    sh script-runner.sh
    ```
3. Register GitLab Runner:

    ```
    sudo gitlab-runner register --url https://gitlab.com/ --registration-token GR1438941oaTvmrZ3TV8c8Z_m31aK
    ```
    Follow the prompts and add tags with comma separated "runner1,autobot1".

    Follow the prompts and select "shell" as the executor.

4. Adjust Bash logout (if needed):

    ```
    sudo nano /home/gitlab-runner/.bash_logout
    ```

5. Install Nodejs in ubuntu server:
    ```
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt install -y nodejs
    ```

6. Install PM2 globally:
    ```
    sudo npm install -g pm2
    ```


## Step 4: Configure CI/CD Pipeline in .gitlab-ci.yml
Configure the GitLab CI/CD pipeline using .gitlab-ci.yml file. Here is a sample configuration:

```
variables:
  BRANCH_NAME: "develop"
  GITLAB_ACCESS_TOKEN: "glpat-DLo-dPHouwDrg5TdsKRC"

stages:
  - deploy

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/

deploy-dev-job:
  stage: deploy
  script:
    - |
      if [ -d "$HOME/.ssh" ]; then 
        echo ".ssh directory already exists" 
      else 
        mkdir -p "$HOME/.ssh"
      fi
    - eval `ssh-agent -s`
    - echo "$AWS_PRIVATE_KEY" | tr -d '\r' > ~/.ssh/id_rsa
    
    - cat ~/.ssh/id_rsa
    - chmod 700 ~/.ssh/id_rsa
    - ssh-add ~/.ssh/id_rsa

    - ssh-keyscan -t rsa $AWS_HOST >> ~/.ssh/known_hosts
    - ssh -v -i ~/.ssh/id_rsa $AWS_USERNAME@$AWS_HOST "
        cd /home/ubuntu && 
        git config --global --add safe.directory /home/ubuntu/backend &&
        if [ -d backend ]; then
          echo "backend folder found....." && 
          cd backend &&
          if [ -d .git ]; then
            git pull origin ${BRANCH_NAME};
          else
            echo ".Git not found we are removing existing folder and cloning project..." && 
            cd .. &&
            sudo rm -rf backend &&
            git clone -b ${BRANCH_NAME} https://gitlab+deploy-token-56954978:${GITLAB_ACCESS_TOKEN}@gitlab.com/saikirandeekonda/cicd-demo.git backend &&
            cd backend &&
            git fetch &&
            git checkout ${BRANCH_NAME} &&
            git pull;
          fi;
        else
          git clone -b ${BRANCH_NAME} https://gitlab+deploy-token-56954978:${GITLAB_ACCESS_TOKEN}@gitlab.com/saikirandeekonda/cicd-demo.git backend &&
          cd backend &&
          echo 'Cloned from git repo';
        fi &&
        npm install &&
        if sudo pm2 status app.js | grep -q 'online'; then
          sudo pm2 restart app.js;
        else
          sudo pm2 start app.js;
        fi" 
  tags:
    - runner1
  rules:
    - if: '$CI_COMMIT_BRANCH == "develop"'
      when: always
    - when: never

```
