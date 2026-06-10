# OpenShift Deploy Log For 90f

App URL:

```powershell
http://90f-90f-dev.apps-crc.testing
```

Note: this Codex shell did not have `oc.exe` in `PATH`, so the deployment was executed with `kubectl` against the already logged-in OpenShift kubeconfig. The resources are OpenShift resources (`BuildConfig`, `ImageStream`, `Route`) applied through the Kubernetes API.

## Commands Run

```powershell
kubectl config current-context
```

Shows the active cluster context. Result used: `90f-dev/api-crc-testing:6443/kubeadmin`.

```powershell
kubectl config view --minify --output jsonpath='{..namespace}'
```

Shows the current namespace/project. Result used: `90f-dev`.

```powershell
kubectl get secret github-openshift-local-token
```

Verifies that the GitHub credentials secret exists in the target project.

```powershell
kubectl api-resources --api-group=build.openshift.io
kubectl api-resources --api-group=route.openshift.io
```

Verifies that the cluster supports OpenShift `BuildConfig` and `Route` resources.

```powershell
kubectl get imagestream 90f
kubectl get buildconfig 90f
kubectl get deployment 90f
kubectl get service 90f
kubectl get route 90f
```

Checks whether the target resources already exist. They did not exist before this deployment.

```powershell
kubectl apply -f .\openshift\90f.yaml
```

Creates/updates:

- `ImageStream/90f`
- `BuildConfig/90f`
- `Deployment/90f`
- `Service/app-90f`
- `Route/90f`

The `BuildConfig` pulls source from `https://github.com/quangchu94/90f.git`, branch `main`, using `sourceSecret.name: github-openshift-local-token`.

```powershell
kubectl get builds --selector=buildconfig=90f
kubectl get build 90f-1 -o yaml
kubectl get pod 90f-1-build
kubectl logs pod/90f-1-build --tail=120
```

Checks the OpenShift build created by the `BuildConfig`, confirms the Git commit, and reads build logs.

```powershell
kubectl get build 90f-1
kubectl get imagestreamtag 90f:latest
```

Confirms build completion and verifies the pushed internal image tag.

```powershell
kubectl rollout restart deployment/90f
kubectl rollout status deployment/90f --timeout=120s
```

Restarts the deployment after the first image is pushed, then waits for the new pod to become ready.

```powershell
kubectl get pods --selector=app=90f -o wide
kubectl get service app-90f
kubectl get endpoints app-90f
kubectl get route 90f -o jsonpath='{.spec.host}'
```

Verifies the running pod, service, endpoint, and route host.

```powershell
Invoke-WebRequest -UseBasicParsing http://90f-90f-dev.apps-crc.testing
```

Smoke-tests the route. Result: `200 OK`, HTML returned.

## Current Result

- Build: `90f-1` completed successfully from Git commit `afc5eff4b5a48672097114459170963843378049`.
- Image: `image-registry.openshift-image-registry.svc:5000/90f-dev/90f@sha256:a657daff3b7f8754efdee82d25f5a129820778629ddbd2e0a676819780baee05`.
- Pod: `90f-b9c977584-cqn54`, `1/1 Running`.
- Service: `app-90f`, port `8080`.
- Route: `http://90f-90f-dev.apps-crc.testing`.
